import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import Sidebar from '../components/Sidebar';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Users, TrendingUp, DollarSign, Award, LogOut, 
  BarChart3, Heart, UserCheck, Briefcase, Activity 
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = ['#26a69a', '#00897b', '#4db6ac', '#80cbc4', '#b2dfdb', '#e0f2f1'];

const AdminDashboard = ({ user, onLogout }) => {
  const [analytics, setAnalytics] = useState(null);
  const [salaryData, setSalaryData] = useState([]);
  const [topDonors, setTopDonors] = useState([]);
  const [mentorMatches, setMentorMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
    fetchSalaryDistribution();
    fetchPredictions();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/analytics/overview`);
      setAnalytics(response.data);
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalaryDistribution = async () => {
    try {
      const response = await axios.get(`${API}/analytics/salary-distribution`);
      setSalaryData(response.data.slice(0, 10));
    } catch (error) {
      console.error('Failed to load salary data');
    }
  };

  const fetchPredictions = async () => {
    try {
      const [donorsRes, mentorsRes] = await Promise.all([
        axios.get(`${API}/predictions/top-donors?limit=10`),
        axios.get(`${API}/predictions/mentor-matches?limit=10`)
      ]);
      setTopDonors(donorsRes.data);
      setMentorMatches(mentorsRes.data);
    } catch (error) {
      console.error('Failed to load predictions');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const sidebarItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: BarChart3,
      active: activeTab === 'overview',
      onClick: () => setActiveTab('overview'),
      testId: 'overview-tab'
    },
    {
      id: 'predictions',
      label: 'Predictions',
      icon: TrendingUp,
      active: activeTab === 'predictions',
      onClick: () => setActiveTab('predictions'),
      testId: 'predictions-tab'
    },
    {
      id: 'engagement',
      label: 'Engagement',
      icon: Activity,
      active: activeTab === 'engagement',
      onClick: () => setActiveTab('engagement'),
      testId: 'engagement-tab'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50 flex">
      {/* Sidebar */}
      <Sidebar
        header={{
          title: 'Admin Dashboard',
          subtitle: user.full_name || 'Administrator'
        }}
        items={sidebarItems}
        onLogout={onLogout}
      />

      {/* Main Content */}
      <div className="flex-1 ml-64 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Key Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-teal-500 to-emerald-500 text-white border-0 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-100 text-sm font-medium mb-1">Total Alumni</p>
                <p className="text-3xl font-bold">{analytics?.total_alumni?.toLocaleString() || 0}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-emerald-500 to-teal-500 text-white border-0 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium mb-1">Active Alumni</p>
                <p className="text-3xl font-bold">{analytics?.active_alumni?.toLocaleString() || 0}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-amber-400 to-orange-400 text-white border-0 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium mb-1">Avg Salary</p>
                <p className="text-3xl font-bold">${(analytics?.avg_salary / 1000).toFixed(0)}K</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-pink-400 to-rose-400 text-white border-0 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-100 text-sm font-medium mb-1">Donations</p>
                <p className="text-3xl font-bold">
                  ${((analytics?.donation_stats?.total_donations || 0) / 1000).toFixed(0)}K
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Heart className="w-6 h-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Industries */}
            <Card className="p-6 bg-white shadow-lg rounded-2xl">
              <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
                <Briefcase className="w-5 h-5 mr-2 text-teal-600" />
                Top Industries
              </h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={analytics?.top_industries || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '2px solid #26a69a',
                      borderRadius: '12px'
                    }} 
                  />
                  <Bar dataKey="count" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#26a69a" />
                      <stop offset="100%" stopColor="#00897b" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Graduation Trends & Salary Distribution */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="p-6 bg-white shadow-lg rounded-2xl">
                <h3 className="text-xl font-bold mb-6 text-gray-800">Graduation Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics?.graduation_trends || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '2px solid #26a69a',
                        borderRadius: '12px'
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#26a69a" 
                      strokeWidth={3}
                      dot={{ fill: '#00897b', r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6 bg-white shadow-lg rounded-2xl">
                <h3 className="text-xl font-bold mb-6 text-gray-800">Salary by Major (Top 10)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salaryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="major" type="category" width={100} tick={{ fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '2px solid #26a69a',
                        borderRadius: '12px'
                      }} 
                    />
                    <Bar dataKey="avg_salary" fill="#4db6ac" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </div>
        )}

        {/* Predictions Tab */}
        {activeTab === 'predictions' && (
          <div className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Top Donor Predictions */}
              <Card className="p-6 bg-white shadow-lg rounded-2xl">
                <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
                  <Heart className="w-5 h-5 mr-2 text-rose-500" />
                  Top Donor Predictions
                </h3>
                <div className="space-y-3">
                  {topDonors.map((donor, idx) => (
                    <div key={idx} className="p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl border border-rose-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{donor.full_name}</p>
                          <p className="text-sm text-gray-600">{donor.email}</p>
                          <p className="text-xs text-gray-500 mt-1">{donor.current_company}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-rose-600">
                            {Math.round(donor.donor_score)}
                          </div>
                          <div className="text-xs text-gray-500">Score</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Mentor Match Predictions */}
              <Card className="p-6 bg-white shadow-lg rounded-2xl">
                <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
                  <UserCheck className="w-5 h-5 mr-2 text-teal-600" />
                  Top Mentor Matches
                </h3>
                <div className="space-y-3">
                  {mentorMatches.map((mentor, idx) => (
                    <div key={idx} className="p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border border-teal-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{mentor.full_name}</p>
                          <p className="text-sm text-gray-600">{mentor.industry}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {mentor.years_since_grad} years experience
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-teal-600">
                            {(mentor.match_score * 100).toFixed(0)}%
                          </div>
                          <div className="text-xs text-gray-500">Match</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Engagement Tab */}
          <TabsContent value="engagement" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="p-6 bg-white shadow-lg rounded-2xl">
                <h3 className="text-lg font-bold mb-4 text-gray-800">Engagement Stats</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Avg Events Attended</p>
                    <p className="text-3xl font-bold text-teal-600">
                      {analytics?.engagement_stats?.avg_events?.toFixed(1) || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg Engagement Score</p>
                    <p className="text-3xl font-bold text-emerald-600">
                      {analytics?.engagement_stats?.avg_engagement?.toFixed(0) || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">High Engagement Alumni</p>
                    <p className="text-3xl font-bold text-teal-600">
                      {analytics?.engagement_stats?.high_engagement || 0}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white shadow-lg rounded-2xl">
                <h3 className="text-lg font-bold mb-4 text-gray-800">Mentorship Stats</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Active Mentors</p>
                    <p className="text-3xl font-bold text-teal-600">
                      {analytics?.mentorship_stats?.total_mentors || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Interested Mentors</p>
                    <p className="text-3xl font-bold text-emerald-600">
                      {analytics?.mentorship_stats?.interested_mentors || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Seeking Mentorship</p>
                    <p className="text-3xl font-bold text-teal-600">
                      {analytics?.mentorship_stats?.mentees || 0}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white shadow-lg rounded-2xl">
                <h3 className="text-lg font-bold mb-4 text-gray-800">Donation Stats</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Donations</p>
                    <p className="text-3xl font-bold text-rose-600">
                      ${((analytics?.donation_stats?.total_donations || 0) / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Active Donors</p>
                    <p className="text-3xl font-bold text-pink-600">
                      {analytics?.donation_stats?.donors_count || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Predicted Next Year</p>
                    <p className="text-3xl font-bold text-rose-600">
                      ${((analytics?.donation_stats?.predicted_donations || 0) / 1000).toFixed(0)}K
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
