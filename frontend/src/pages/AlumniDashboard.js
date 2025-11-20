import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Switch } from '../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import Sidebar from '../components/Sidebar';
import { 
  User, Briefcase, Calendar, Award, LogOut, 
  Mail, MapPin, TrendingUp, Heart, Users, Target 
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AlumniDashboard = ({ user, onLogout }) => {
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [donorPrediction, setDonorPrediction] = useState(null);
  const [mentorPrediction, setMentorPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  
  // Event Registration Modal State
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    dietary_preferences: '',
    comments: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (user.alumni_id) {
      fetchProfile();
      fetchEvents();
      fetchPrediction();
    }
  }, [user.alumni_id]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/alumni/profile/${user.alumni_id}`);
      setProfile(response.data);
      setEditForm({
        current_company: response.data.current_company || '',
        current_title: response.data.current_title || '',
        mentorship_interest: response.data.mentorship_interest || false,
        location_city: response.data.location_city || '',
        location_country: response.data.location_country || ''
      });
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API}/events/upcoming`);
      setEvents(response.data);
    } catch (error) {
      console.error('Failed to load events');
    }
  };

  const fetchPrediction = async () => {
    try {
      const [engagementRes, donorRes, mentorRes] = await Promise.all([
        axios.post(`${API}/predictions/analyze`, {
          alumni_id: user.alumni_id,
          prediction_type: 'engagement'
        }),
        axios.post(`${API}/predictions/analyze`, {
          alumni_id: user.alumni_id,
          prediction_type: 'donor'
        }),
        axios.post(`${API}/predictions/analyze`, {
          alumni_id: user.alumni_id,
          prediction_type: 'mentor'
        })
      ]);
      setPrediction(engagementRes.data);
      setDonorPrediction(donorRes.data);
      setMentorPrediction(mentorRes.data);
    } catch (error) {
      console.error('Failed to load prediction');
    }
  };

  const handleEventRegister = (event) => {
    setSelectedEvent(event);
    setEventForm({
      full_name: profile?.full_name || '',
      email: profile?.email || '',
      phone: '',
      dietary_preferences: '',
      comments: ''
    });
    setShowEventModal(true);
  };

  const submitEventRegistration = async () => {
    if (!eventForm.full_name || !eventForm.email) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      await axios.post(`${API}/events/register`, {
        event_id: selectedEvent.id,
        alumni_id: user.alumni_id,
        ...eventForm
      });
      
      setShowEventModal(false);
      setShowSuccess(true);
      
      // Refresh profile to update events_attended
      setTimeout(() => {
        fetchProfile();
        setShowSuccess(false);
      }, 2000);
    } catch (error) {
      toast.error('Failed to register for event');
    }
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`${API}/alumni/profile/${user.alumni_id}`, editForm);
      toast.success('Profile updated successfully');
      setEditing(false);
      fetchProfile();
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Alumni Portal</h1>
            <p className="text-sm text-gray-600">Welcome, {profile?.full_name}</p>
          </div>
          <Button 
            data-testid="alumni-logout-btn"
            onClick={onLogout}
            variant="outline"
            className="border-2 border-red-200 text-red-600 hover:bg-red-50 rounded-xl"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Profile Overview */}
        <Card className="p-8 mb-8 bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-xl rounded-2xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-12 h-12" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-2">{profile?.full_name}</h2>
                <div className="flex items-center gap-4 text-teal-50">
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {profile?.email}
                  </span>
                  {profile?.location_city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {profile?.location_city}, {profile?.location_country}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button
              data-testid="edit-profile-btn"
              onClick={() => setEditing(!editing)}
              className="bg-white text-teal-600 hover:bg-teal-50 rounded-xl font-semibold"
            >
              {editing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>
        </Card>

        {/* Edit Form */}
        {editing && (
          <Card className="p-6 mb-8 bg-white shadow-lg rounded-2xl">
            <h3 className="text-xl font-bold mb-6 text-gray-800">Update Profile</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Current Company</label>
                <Input
                  data-testid="edit-company-input"
                  value={editForm.current_company}
                  onChange={(e) => setEditForm({...editForm, current_company: e.target.value})}
                  className="border-2 border-gray-200 focus:border-teal-500 rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Current Title</label>
                <Input
                  data-testid="edit-title-input"
                  value={editForm.current_title}
                  onChange={(e) => setEditForm({...editForm, current_title: e.target.value})}
                  className="border-2 border-gray-200 focus:border-teal-500 rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">City</label>
                <Input
                  data-testid="edit-city-input"
                  value={editForm.location_city}
                  onChange={(e) => setEditForm({...editForm, location_city: e.target.value})}
                  className="border-2 border-gray-200 focus:border-teal-500 rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Country</label>
                <Input
                  data-testid="edit-country-input"
                  value={editForm.location_country}
                  onChange={(e) => setEditForm({...editForm, location_country: e.target.value})}
                  className="border-2 border-gray-200 focus:border-teal-500 rounded-xl"
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  data-testid="mentorship-interest-switch"
                  checked={editForm.mentorship_interest}
                  onCheckedChange={(checked) => setEditForm({...editForm, mentorship_interest: checked})}
                />
                <label className="text-sm font-medium text-gray-700">Interested in Mentorship</label>
              </div>
            </div>
            <Button
              data-testid="save-profile-btn"
              onClick={handleUpdate}
              className="mt-6 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-xl font-semibold"
            >
              Save Changes
            </Button>
          </Card>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white border-2 border-gray-200 p-1 rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-teal-500 data-[state=active]:text-white">
              <User className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="events" className="rounded-lg data-[state=active]:bg-teal-500 data-[state=active]:text-white">
              <Calendar className="w-4 h-4 mr-2" />
              Events
            </TabsTrigger>
            <TabsTrigger value="insights" className="rounded-lg data-[state=active]:bg-teal-500 data-[state=active]:text-white">
              <TrendingUp className="w-4 h-4 mr-2" />
              Insights
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="p-6 bg-white shadow-lg rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-700">Education</h3>
                  <Award className="w-5 h-5 text-teal-600" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Major</p>
                  <p className="font-bold text-gray-800">{profile?.major}</p>
                  <p className="text-sm text-gray-600 mt-3">GPA</p>
                  <p className="font-bold text-gray-800">{profile?.gpa}</p>
                  <p className="text-sm text-gray-600 mt-3">Graduation Year</p>
                  <p className="font-bold text-gray-800">{profile?.grad_year}</p>
                </div>
              </Card>

              <Card className="p-6 bg-white shadow-lg rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-700">Employment</h3>
                  <Briefcase className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Company</p>
                  <p className="font-bold text-gray-800">{profile?.current_company || 'N/A'}</p>
                  <p className="text-sm text-gray-600 mt-3">Title</p>
                  <p className="font-bold text-gray-800">{profile?.current_title || 'N/A'}</p>
                  <p className="text-sm text-gray-600 mt-3">Industry</p>
                  <p className="font-bold text-gray-800">{profile?.industry || 'N/A'}</p>
                </div>
              </Card>

              <Card className="p-6 bg-white shadow-lg rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-700">Engagement</h3>
                  <Users className="w-5 h-5 text-teal-600" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Events Attended</p>
                  <p className="font-bold text-gray-800">{profile?.events_attended || 0}</p>
                  <p className="text-sm text-gray-600 mt-3">Engagement Score</p>
                  <p className="font-bold text-gray-800">{profile?.engagement_score || 0}</p>
                  <p className="text-sm text-gray-600 mt-3">Profile Complete</p>
                  <p className="font-bold text-gray-800">{profile?.profile_completeness || 0}%</p>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Card key={event.id} className="p-6 bg-white shadow-lg rounded-2xl hover:shadow-xl transition-all">
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-teal-100 text-teal-700 text-xs font-semibold rounded-full mb-3">
                      {event.category}
                    </span>
                    <h3 className="font-bold text-lg text-gray-800 mb-2">{event.title}</h3>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {event.date}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </p>
                    <p className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {event.attendees} attending
                    </p>
                  </div>
                  <Button 
                    data-testid={`register-event-${event.id}-btn`}
                    className="w-full mt-4 bg-teal-500 hover:bg-teal-600 text-white rounded-xl"
                  >
                    Register
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            {prediction && (
              <Card className="p-8 bg-gradient-to-r from-teal-50 to-emerald-50 shadow-lg rounded-2xl border-2 border-teal-200">
                <h3 className="text-2xl font-bold mb-4 text-gray-800">Your Engagement Insight</h3>
                <div className="flex items-center gap-8 mb-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Engagement Score</p>
                    <div className="text-5xl font-bold text-teal-600">{prediction.score.toFixed(0)}</div>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-700 leading-relaxed">
                      <strong className="text-teal-700">Recommendation:</strong> {prediction.recommendation}
                    </p>
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {Object.entries(prediction.factors).map(([key, value]) => (
                    <div key={key} className="bg-white p-4 rounded-xl">
                      <p className="text-xs text-gray-600 mb-1 capitalize">{key.replace(/_/g, ' ')}</p>
                      <p className="text-2xl font-bold text-teal-600">{value}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AlumniDashboard;
