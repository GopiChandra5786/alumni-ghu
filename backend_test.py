#!/usr/bin/env python3
"""
Backend API Testing for GHU Alumni Connect
Tests all backend endpoints as specified in the review request
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from frontend/.env
BASE_URL = "https://alumni-connect-51.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.failed_tests = []
        
    def log_result(self, test_name, success, details="", response_data=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "response_data": response_data,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success:
            self.failed_tests.append(test_name)
        print()
    
    def test_alumni_registration(self):
        """Test POST /api/auth/register for alumni"""
        url = f"{BASE_URL}/auth/register"
        payload = {
            "full_name": "Test Alumni",
            "email": "test_alumni@test.com",
            "password": "test123",
            "role": "alumni",
            "major": "Computer Science",
            "grad_year": 2020
        }
        
        try:
            response = self.session.post(url, json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if "alumni_id" in data and "message" in data:
                    self.log_result("Alumni Registration", True, 
                                  f"Alumni ID: {data.get('alumni_id')}", data)
                    return data.get('alumni_id')
                else:
                    self.log_result("Alumni Registration", False, 
                                  f"Missing required fields in response: {data}")
            elif response.status_code == 400 and "already registered" in response.text:
                self.log_result("Alumni Registration", True, 
                              "Email already registered (expected behavior)", response.json())
                # Try to get existing alumni_id by attempting login
                return 20001  # Return a default ID for testing
            else:
                self.log_result("Alumni Registration", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("Alumni Registration", False, f"Exception: {str(e)}")
        
        return None
    
    def test_employer_registration(self):
        """Test POST /api/auth/register for employer"""
        url = f"{BASE_URL}/auth/register"
        payload = {
            "full_name": "Test Employer",
            "email": "test_employer@test.com",
            "password": "test123",
            "role": "employer",
            "company_name": "Test Corp"
        }
        
        try:
            response = self.session.post(url, json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if "employer_id" in data and "message" in data:
                    self.log_result("Employer Registration", True, 
                                  f"Employer ID: {data.get('employer_id')}", data)
                    return data.get('employer_id')
                else:
                    self.log_result("Employer Registration", False, 
                                  f"Missing required fields in response: {data}")
            elif response.status_code == 400 and "already registered" in response.text:
                self.log_result("Employer Registration", True, 
                              "Email already registered (expected behavior)", response.json())
                return "emp_test123"  # Return a default ID for testing
            else:
                self.log_result("Employer Registration", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("Employer Registration", False, f"Exception: {str(e)}")
        
        return None
    
    def test_event_registration(self, alumni_id):
        """Test POST /api/events/register"""
        url = f"{BASE_URL}/events/register"
        payload = {
            "event_id": 1,
            "alumni_id": alumni_id or 10001,
            "full_name": "John Doe",
            "email": "john@test.com",
            "phone": "123-456-7890",
            "dietary_preferences": "Vegetarian",
            "comments": "Looking forward to it"
        }
        
        try:
            response = self.session.post(url, json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if "registration_id" in data and data.get("status") == "confirmed":
                    self.log_result("Event Registration", True, 
                                  f"Registration ID: {data.get('registration_id')}", data)
                else:
                    self.log_result("Event Registration", False, 
                                  f"Missing required fields or incorrect status: {data}")
            else:
                self.log_result("Event Registration", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("Event Registration", False, f"Exception: {str(e)}")
    
    def test_skills_search(self):
        """Test GET /api/employers/search-candidates with skills filter"""
        # Test 1: Search by Python skills
        url = f"{BASE_URL}/employers/search-candidates"
        params = {"skills": "Python"}
        
        try:
            response = self.session.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("Skills Search - Python", True, 
                                  f"Found {len(data)} candidates with Python skills", 
                                  {"count": len(data), "sample": data[:2] if data else []})
                else:
                    self.log_result("Skills Search - Python", False, 
                                  f"Expected list, got: {type(data)}")
            else:
                self.log_result("Skills Search - Python", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("Skills Search - Python", False, f"Exception: {str(e)}")
        
        # Test 2: Search by JavaScript and Computer Science major
        params = {"skills": "JavaScript", "major": "Computer Science"}
        
        try:
            response = self.session.get(url, params=params)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_result("Skills Search - Combined Filters", True, 
                                  f"Found {len(data)} candidates with JavaScript + CS major", 
                                  {"count": len(data), "sample": data[:2] if data else []})
                else:
                    self.log_result("Skills Search - Combined Filters", False, 
                                  f"Expected list, got: {type(data)}")
            else:
                self.log_result("Skills Search - Combined Filters", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("Skills Search - Combined Filters", False, f"Exception: {str(e)}")
    
    def test_filter_options(self):
        """Test GET /api/filters/majors and /api/filters/skills"""
        # Test majors filter
        url = f"{BASE_URL}/filters/majors"
        
        try:
            response = self.session.get(url)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    self.log_result("Filter Options - Majors", True, 
                                  f"Retrieved {len(data)} majors", 
                                  {"count": len(data), "sample": data[:5]})
                else:
                    self.log_result("Filter Options - Majors", False, 
                                  f"Expected non-empty list, got: {data}")
            else:
                self.log_result("Filter Options - Majors", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("Filter Options - Majors", False, f"Exception: {str(e)}")
        
        # Test skills filter
        url = f"{BASE_URL}/filters/skills"
        
        try:
            response = self.session.get(url)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    self.log_result("Filter Options - Skills", True, 
                                  f"Retrieved {len(data)} skills", 
                                  {"count": len(data), "sample": data[:5]})
                else:
                    self.log_result("Filter Options - Skills", False, 
                                  f"Expected non-empty list, got: {data}")
            else:
                self.log_result("Filter Options - Skills", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("Filter Options - Skills", False, f"Exception: {str(e)}")
    
    def test_contact_candidate(self):
        """Test POST /api/employers/contact-candidate"""
        url = f"{BASE_URL}/employers/contact-candidate"
        payload = {
            "employer_email": "employer@test.com",
            "employer_name": "Test Employer",
            "company_name": "Test Corp",
            "candidate_id": 10001,
            "candidate_email": "candidate@test.com",
            "subject": "Job Opportunity",
            "message": "We have a great opportunity",
            "job_title": "Software Engineer"
        }
        
        try:
            response = self.session.post(url, json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if "message_id" in data and data.get("status") == "sent":
                    self.log_result("Contact Candidate", True, 
                                  f"Message ID: {data.get('message_id')}", data)
                else:
                    self.log_result("Contact Candidate", False, 
                                  f"Missing required fields or incorrect status: {data}")
            else:
                self.log_result("Contact Candidate", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("Contact Candidate", False, f"Exception: {str(e)}")
    
    def test_predictions(self, alumni_id):
        """Test POST /api/predictions/analyze"""
        url = f"{BASE_URL}/predictions/analyze"
        
        # Test donor prediction
        payload = {
            "alumni_id": alumni_id or 10001,
            "prediction_type": "donor"
        }
        
        try:
            response = self.session.post(url, json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if "score" in data and "factors" in data:
                    self.log_result("Predictions - Donor", True, 
                                  f"Score: {data.get('score')}, Recommendation: {data.get('recommendation')}", 
                                  data)
                else:
                    self.log_result("Predictions - Donor", False, 
                                  f"Missing required fields: {data}")
            else:
                self.log_result("Predictions - Donor", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("Predictions - Donor", False, f"Exception: {str(e)}")
        
        # Test mentor prediction
        payload["prediction_type"] = "mentor"
        
        try:
            response = self.session.post(url, json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if "score" in data and "recommendation" in data:
                    self.log_result("Predictions - Mentor", True, 
                                  f"Score: {data.get('score')}, Recommendation: {data.get('recommendation')}", 
                                  data)
                else:
                    self.log_result("Predictions - Mentor", False, 
                                  f"Missing required fields: {data}")
            else:
                self.log_result("Predictions - Mentor", False, 
                              f"Status: {response.status_code}, Response: {response.text}")
        except Exception as e:
            self.log_result("Predictions - Mentor", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("=" * 60)
        print("GHU Alumni Connect - Backend API Testing")
        print("=" * 60)
        print(f"Testing against: {BASE_URL}")
        print()
        
        # Test registration endpoints
        print("🔐 Testing Registration Endpoints...")
        alumni_id = self.test_alumni_registration()
        employer_id = self.test_employer_registration()
        
        # Test event registration
        print("📅 Testing Event Registration...")
        self.test_event_registration(alumni_id)
        
        # Test skills search
        print("🔍 Testing Skills Search...")
        self.test_skills_search()
        
        # Test filter options
        print("📋 Testing Filter Options...")
        self.test_filter_options()
        
        # Test contact candidate
        print("📧 Testing Contact Candidate...")
        self.test_contact_candidate()
        
        # Test predictions
        print("🔮 Testing Predictions...")
        self.test_predictions(alumni_id)
        
        # Summary
        print("=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r["success"]])
        failed_tests = len(self.failed_tests)
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"  - {test}")
        
        print("\n" + "=" * 60)
        
        return {
            "total": total_tests,
            "passed": passed_tests,
            "failed": failed_tests,
            "failed_tests": self.failed_tests,
            "results": self.test_results
        }

if __name__ == "__main__":
    tester = BackendTester()
    results = tester.run_all_tests()
    
    # Exit with error code if any tests failed
    sys.exit(1 if results["failed"] > 0 else 0)