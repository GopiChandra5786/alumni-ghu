from fastapi import FastAPI, APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class LoginRequest(BaseModel):
    email: str
    role: str  # 'alumni', 'admin', 'employer'

class LoginResponse(BaseModel):
    token: str
    role: str
    user: Dict[str, Any]

class AlumniProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    alumni_id: Optional[int] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    major: Optional[str] = None
    gpa: Optional[float] = None
    grad_year: Optional[int] = None
    current_company: Optional[str] = None
    current_title: Optional[str] = None
    industry: Optional[str] = None
    salary: Optional[float] = None
    mentorship_interest: Optional[bool] = None
    events_attended: Optional[int] = None
    engagement_score: Optional[float] = None
    profile_completeness: Optional[float] = None

class AlumniUpdate(BaseModel):
    current_company: Optional[str] = None
    current_title: Optional[str] = None
    mentorship_interest: Optional[bool] = None
    location_city: Optional[str] = None
    location_country: Optional[str] = None

class AnalyticsResponse(BaseModel):
    total_alumni: int
    active_alumni: int
    avg_salary: float
    top_industries: List[Dict[str, Any]]
    graduation_trends: List[Dict[str, Any]]
    engagement_stats: Dict[str, Any]
    mentorship_stats: Dict[str, Any]
    donation_stats: Dict[str, Any]

class PredictionRequest(BaseModel):
    alumni_id: int
    prediction_type: str  # 'donor', 'mentor', 'engagement'

class PredictionResponse(BaseModel):
    alumni_id: int
    prediction_type: str
    score: float
    factors: Dict[str, Any]
    recommendation: str

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Mock authentication - simple role-based login"""
    try:
        if request.role == 'alumni':
            # Find alumni by email
            alumni = await db.alumni.find_one({"email": request.email}, {"_id": 0})
            if not alumni:
                raise HTTPException(status_code=404, detail="Alumni not found")
            user_data = {
                "alumni_id": alumni.get("alumni_id"),
                "full_name": alumni.get("full_name"),
                "email": alumni.get("email"),
                "role": "alumni"
            }
        elif request.role == 'admin':
            user_data = {
                "admin_id": "admin_001",
                "full_name": "Admin User",
                "email": request.email,
                "role": "admin"
            }
        elif request.role == 'employer':
            user_data = {
                "employer_id": "emp_001",
                "company_name": "Tech Corp",
                "email": request.email,
                "role": "employer"
            }
        else:
            raise HTTPException(status_code=400, detail="Invalid role")
        
        # Generate mock token
        token = f"mock_token_{uuid.uuid4().hex[:16]}"
        
        return LoginResponse(token=token, role=request.role, user=user_data)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== ALUMNI ENDPOINTS ====================

@api_router.get("/alumni/profile/{alumni_id}")
async def get_alumni_profile(alumni_id: int):
    """Get detailed alumni profile"""
    alumni = await db.alumni.find_one({"alumni_id": alumni_id}, {"_id": 0})
    if not alumni:
        raise HTTPException(status_code=404, detail="Alumni not found")
    return alumni

@api_router.put("/alumni/profile/{alumni_id}")
async def update_alumni_profile(alumni_id: int, update: AlumniUpdate):
    """Update alumni profile"""
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.alumni.update_one(
        {"alumni_id": alumni_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Alumni not found")
    
    return {"message": "Profile updated successfully"}

@api_router.get("/alumni/search")
async def search_alumni(
    major: Optional[str] = None,
    industry: Optional[str] = None,
    company: Optional[str] = None,
    limit: int = 50
):
    """Search alumni by filters"""
    query = {}
    if major:
        query["major"] = {"$regex": major, "$options": "i"}
    if industry:
        query["industry"] = {"$regex": industry, "$options": "i"}
    if company:
        query["current_company"] = {"$regex": company, "$options": "i"}
    
    alumni = await db.alumni.find(query, {"_id": 0}).limit(limit).to_list(limit)
    return alumni

# ==================== ANALYTICS ENDPOINTS ====================

@api_router.get("/analytics/overview", response_model=AnalyticsResponse)
async def get_analytics_overview():
    """Get comprehensive analytics overview"""
    try:
        # Total alumni count
        total_alumni = await db.alumni.count_documents({})
        
        # Active alumni (engagement_score > 50)
        active_alumni = await db.alumni.count_documents({"engagement_score": {"$gt": 50}})
        
        # Average salary
        salary_pipeline = [
            {"$match": {"salary": {"$ne": None, "$gt": 0}}},
            {"$group": {"_id": None, "avg_salary": {"$avg": "$salary"}}}
        ]
        salary_result = await db.alumni.aggregate(salary_pipeline).to_list(1)
        avg_salary = salary_result[0]["avg_salary"] if salary_result else 0
        
        # Top industries
        industry_pipeline = [
            {"$match": {"industry": {"$ne": None, "$ne": ""}}},
            {"$group": {"_id": "$industry", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        industries = await db.alumni.aggregate(industry_pipeline).to_list(10)
        top_industries = [{"name": i["_id"], "count": i["count"]} for i in industries]
        
        # Graduation trends
        grad_pipeline = [
            {"$match": {"grad_year": {"$ne": None}}},
            {"$group": {"_id": "$grad_year", "count": {"$sum": 1}}},
            {"$sort": {"_id": 1}}
        ]
        grad_data = await db.alumni.aggregate(grad_pipeline).to_list(100)
        graduation_trends = [{"year": g["_id"], "count": g["count"]} for g in grad_data]
        
        # Engagement stats
        engagement_pipeline = [
            {"$group": {
                "_id": None,
                "avg_events": {"$avg": "$events_attended"},
                "avg_engagement": {"$avg": "$engagement_score"},
                "high_engagement": {"$sum": {"$cond": [{"$gt": ["$engagement_score", 70]}, 1, 0]}}
            }}
        ]
        engagement_data = await db.alumni.aggregate(engagement_pipeline).to_list(1)
        engagement_stats = engagement_data[0] if engagement_data else {}
        
        # Mentorship stats
        mentorship_pipeline = [
            {"$group": {
                "_id": None,
                "total_mentors": {"$sum": {"$cond": [{"$eq": ["$mentor_status", "active"]}, 1, 0]}},
                "interested_mentors": {"$sum": {"$cond": [{"$eq": ["$mentor_status", "interested"]}, 1, 0]}},
                "mentees": {"$sum": {"$cond": ["$mentorship_interest", 1, 0]}}
            }}
        ]
        mentorship_data = await db.alumni.aggregate(mentorship_pipeline).to_list(1)
        mentorship_stats = mentorship_data[0] if mentorship_data else {}
        
        # Donation stats
        donation_pipeline = [
            {"$group": {
                "_id": None,
                "total_donations": {"$sum": "$donation_last_year"},
                "donors_count": {"$sum": {"$cond": [{"$gt": ["$donation_last_year", 0]}, 1, 0]}},
                "predicted_donations": {"$sum": "$donation_next_year"}
            }}
        ]
        donation_data = await db.alumni.aggregate(donation_pipeline).to_list(1)
        donation_stats = donation_data[0] if donation_data else {}
        
        return AnalyticsResponse(
            total_alumni=total_alumni,
            active_alumni=active_alumni,
            avg_salary=round(avg_salary, 2),
            top_industries=top_industries,
            graduation_trends=graduation_trends,
            engagement_stats=engagement_stats,
            mentorship_stats=mentorship_stats,
            donation_stats=donation_stats
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/analytics/salary-distribution")
async def get_salary_distribution():
    """Get salary distribution by major"""
    pipeline = [
        {"$match": {"salary": {"$ne": None, "$gt": 0}, "major": {"$ne": None, "$ne": ""}}},
        {"$group": {
            "_id": "$major",
            "avg_salary": {"$avg": "$salary"},
            "min_salary": {"$min": "$salary"},
            "max_salary": {"$max": "$salary"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"avg_salary": -1}},
        {"$limit": 15}
    ]
    result = await db.alumni.aggregate(pipeline).to_list(15)
    return [{"major": r["_id"], "avg_salary": round(r["avg_salary"], 2), 
             "min_salary": r["min_salary"], "max_salary": r["max_salary"],
             "count": r["count"]} for r in result]

@api_router.get("/analytics/engagement-metrics")
async def get_engagement_metrics():
    """Get detailed engagement metrics"""
    pipeline = [
        {"$match": {"engagement_score": {"$ne": None}}},
        {"$bucket": {
            "groupBy": "$engagement_score",
            "boundaries": [0, 25, 50, 75, 100],
            "default": "Other",
            "output": {"count": {"$sum": 1}}
        }}
    ]
    result = await db.alumni.aggregate(pipeline).to_list(10)
    return result

# ==================== PREDICTION ENDPOINTS ====================

@api_router.post("/predictions/analyze", response_model=PredictionResponse)
async def analyze_prediction(request: PredictionRequest):
    """Generate predictive analytics for an alumni"""
    alumni = await db.alumni.find_one({"alumni_id": request.alumni_id}, {"_id": 0})
    if not alumni:
        raise HTTPException(status_code=404, detail="Alumni not found")
    
    if request.prediction_type == 'donor':
        # Donor likelihood prediction
        score = 0.0
        factors = {}
        
        # Factor 1: Past donation history (40%)
        if alumni.get("donation_last_year"):
            donation_factor = min(alumni.get("donation_last_year", 0) / 1000, 1.0) * 40
            score += donation_factor
            factors["past_donations"] = donation_factor
        
        # Factor 2: Engagement score (30%)
        if alumni.get("engagement_score"):
            engagement_factor = (alumni.get("engagement_score", 0) / 100) * 30
            score += engagement_factor
            factors["engagement"] = engagement_factor
        
        # Factor 3: Salary level (20%)
        if alumni.get("salary"):
            salary_factor = min(alumni.get("salary", 0) / 500000, 1.0) * 20
            score += salary_factor
            factors["income_capacity"] = salary_factor
        
        # Factor 4: Years since graduation (10%)
        if alumni.get("years_since_grad"):
            years_factor = min(alumni.get("years_since_grad", 0) / 10, 1.0) * 10
            score += years_factor
            factors["alumni_tenure"] = years_factor
        
        score = min(score, 100)
        
        if score >= 75:
            recommendation = "High priority donor - schedule personal outreach"
        elif score >= 50:
            recommendation = "Potential donor - include in email campaigns"
        else:
            recommendation = "Low priority - focus on engagement first"
        
    elif request.prediction_type == 'mentor':
        # Mentor match prediction
        score = alumni.get("match_score", 0) * 100 if alumni.get("match_score") else 0
        
        factors = {
            "experience_years": alumni.get("years_since_grad", 0),
            "mentoring_feedback": alumni.get("mentoring_feedback_score", 0),
            "leadership_score": alumni.get("leader", 0),
            "communication_score": alumni.get("communication", 0)
        }
        
        if score >= 70:
            recommendation = "Excellent mentor candidate - reach out immediately"
        elif score >= 50:
            recommendation = "Good mentor potential - invite to program"
        else:
            recommendation = "Needs more experience or engagement"
    
    else:  # engagement prediction
        score = alumni.get("engagement_score", 0)
        factors = {
            "events_attended": alumni.get("events_attended", 0),
            "mentorship_active": 1 if alumni.get("mentorship_interest") else 0,
            "profile_complete": alumni.get("profile_completeness", 0)
        }
        recommendation = "Keep engaged with regular communications" if score >= 50 else "Re-engagement campaign needed"
    
    return PredictionResponse(
        alumni_id=request.alumni_id,
        prediction_type=request.prediction_type,
        score=round(score, 2),
        factors=factors,
        recommendation=recommendation
    )

@api_router.get("/predictions/top-donors")
async def get_top_donor_predictions(limit: int = 20):
    """Get top predicted donors"""
    pipeline = [
        {"$match": {"donation_next_year": {"$ne": None}}},
        {"$addFields": {
            "donor_score": {
                "$add": [
                    {"$multiply": [{"$ifNull": ["$donation_last_year", 0]}, 0.4]},
                    {"$multiply": [{"$ifNull": ["$engagement_score", 0]}, 0.3]},
                    {"$multiply": [{"$divide": [{"$ifNull": ["$salary", 0]}, 5000]}, 0.2]},
                    {"$multiply": [{"$ifNull": ["$years_since_grad", 0]}, 10]}
                ]
            }
        }},
        {"$sort": {"donor_score": -1}},
        {"$limit": limit},
        {"$project": {
            "_id": 0,
            "alumni_id": 1,
            "full_name": 1,
            "email": 1,
            "donor_score": 1,
            "donation_last_year": 1,
            "engagement_score": 1,
            "current_company": 1
        }}
    ]
    result = await db.alumni.aggregate(pipeline).to_list(limit)
    return result

@api_router.get("/predictions/mentor-matches")
async def get_mentor_matches(limit: int = 20):
    """Get top mentor match candidates"""
    alumni = await db.alumni.find(
        {"match_score": {"$ne": None, "$gt": 0.5}},
        {"_id": 0, "alumni_id": 1, "full_name": 1, "email": 1, 
         "match_score": 1, "mentor_status": 1, "current_company": 1,
         "industry": 1, "years_since_grad": 1}
    ).sort("match_score", -1).limit(limit).to_list(limit)
    return alumni

# ==================== EVENTS & MENTORSHIP ====================

@api_router.get("/events/upcoming")
async def get_upcoming_events():
    """Get upcoming events (mock data)"""
    events = [
        {
            "id": 1,
            "title": "Annual Alumni Gala 2025",
            "date": "2025-12-15",
            "location": "GHU Main Campus",
            "category": "networking",
            "attendees": 250
        },
        {
            "id": 2,
            "title": "Career Fair & Employer Meetup",
            "date": "2025-11-20",
            "location": "Virtual",
            "category": "career",
            "attendees": 180
        },
        {
            "id": 3,
            "title": "Mentorship Program Launch",
            "date": "2025-11-05",
            "location": "Online Webinar",
            "category": "mentorship",
            "attendees": 120
        }
    ]
    return events

@api_router.post("/mentorship/request")
async def request_mentorship(alumni_id: int, mentor_id: int):
    """Request mentorship connection"""
    return {"message": "Mentorship request sent successfully", "status": "pending"}

# ==================== EMPLOYER ENDPOINTS ====================

@api_router.get("/employers/search-candidates")
async def search_candidates(
    skills: Optional[str] = None,
    major: Optional[str] = None,
    experience: Optional[int] = None,
    limit: int = 30
):
    """Search alumni candidates for hiring"""
    query = {}
    if major:
        query["major"] = {"$regex": major, "$options": "i"}
    if skills:
        query["field_of_study"] = {"$regex": skills, "$options": "i"}
    if experience:
        query["years_since_grad"] = {"$gte": experience}
    
    candidates = await db.alumni.find(
        query,
        {"_id": 0, "alumni_id": 1, "full_name": 1, "email": 1,
         "major": 1, "gpa": 1, "current_company": 1, "current_title": 1,
         "years_since_grad": 1, "skills": 1}
    ).limit(limit).to_list(limit)
    return candidates

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
