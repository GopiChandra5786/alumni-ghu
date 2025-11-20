import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import Sidebar from '../components/Sidebar';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Users, TrendingUp, DollarSign, Award, LogOut, 
  BarChart3, Heart, UserCheck, Briefcase, Activity, Filter 
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
  
  // Graph view controls
  const [selectedGraph, setSelectedGraph] = useState('industry');

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
      label: 'Analytics Overview',
      icon: BarChart3,
      active: activeTab === 'overview',
      onClick: () => setActiveTab('overview'),
      testId: 'overview-tab'
    },
    {
      id: 'engagement',
      label: 'Engagement Metrics',
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
            {/* Graph Selection and Filters */}
            <Card className="p-6 bg-white shadow-xl rounded-2xl border-2 border-teal-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <Filter className="w-7 h-7 text-teal-600" />
                  Interactive Analytics
                </h3>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Select Graph Type</label>
                  <Select value={selectedGraph} onValueChange={setSelectedGraph}>
                    <SelectTrigger className="border-2 border-gray-300 focus:border-teal-500 rounded-xl h-12">
                      <SelectValue placeholder="Choose Graph" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="industry">Alumni by Industry</SelectItem>
                      <SelectItem value="major">Alumni by Major</SelectItem>
                      <SelectItem value="graduation">Graduation Trends</SelectItem>
                      <SelectItem value="salary">Salary Distribution</SelectItem>
                      <SelectItem value="gpa">GPA Distribution</SelectItem>
                      <SelectItem value="employment">Employment Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Filter by Major</label>
                  <Select value={selectedMajor} onValueChange={setSelectedMajor}>
                    <SelectTrigger className="border-2 border-gray-300 focus:border-teal-500 rounded-xl h-12">
                      <SelectValue placeholder="All Majors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Majors</SelectItem>
                      <SelectItem value="Computer Science">Computer Science</SelectItem>
                      <SelectItem value="Physics">Physics</SelectItem>
                      <SelectItem value="Mathematics">Mathematics</SelectItem>
                      <SelectItem value="Biology">Biology</SelectItem>
                      <SelectItem value="Economics">Economics</SelectItem>
                      <SelectItem value="History">History</SelectItem>
                      <SelectItem value="English">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">Filter by Year</label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="border-2 border-gray-300 focus:border-teal-500 rounded-xl h-12">
                      <SelectValue placeholder="All Years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                      <SelectItem value="2022">2022</SelectItem>
                      <SelectItem value="2021">2021</SelectItem>
                      <SelectItem value="2020">2020</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dynamic Graph Display */}
              <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-6 border-2 border-teal-200">
                {selectedGraph === 'industry' && (
                  <>
                    <h4 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-teal-600" />
                      Alumni Distribution by Industry
                    </h4>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={analytics?.top_industries || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip contentStyle={{ backgroundColor: '#fff', border: '2px solid #26a69a', borderRadius: '8px' }} />
                        <Legend />
                        <Bar dataKey="count" fill="#26a69a" radius={[8, 8, 0, 0]} name="Alumni Count" />
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                )}

                {selectedGraph === 'major' && (
                  <>
                    <h4 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                      <Award className="w-5 h-5 text-teal-600" />
                      Alumni Distribution by Major
                    </h4>
                    <ResponsiveContainer width="100%" height={400}>
                      <PieChart>
                        <Pie
                          data={analytics?.top_majors || []}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={130}
                          label={(entry) => `${entry.name}: ${entry.count}`}
                        >
                          {(analytics?.top_majors || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </>
                )}

                {selectedGraph === 'graduation' && (
                  <>
                    <h4 className="text-xl font-bold mb-4 text-gray-800">Graduation Trends Over Time</h4>
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart data={analytics?.graduation_trends || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip contentStyle={{ backgroundColor: '#fff', border: '2px solid #26a69a', borderRadius: '8px' }} />
                        <Legend />
                        <Area type="monotone" dataKey="count" stroke="#26a69a" fill="#4db6ac" name="Graduates" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </>
                )}

                {selectedGraph === 'salary' && (
                  <>
                    <h4 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-amber-600" />
                      Average Salary by Major
                    </h4>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={salaryData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="major" type="category" width={120} tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#fff', border: '2px solid #fbbf24', borderRadius: '8px' }} />
                        <Legend />
                        <Bar dataKey="avg_salary" fill="#fbbf24" radius={[0, 8, 8, 0]} name="Avg Salary ($)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                )}

                {selectedGraph === 'gpa' && (
                  <>
                    <h4 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                      <Award className="w-5 h-5 text-emerald-600" />
                      GPA Distribution
                    </h4>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={[
                        { range: '3.5-4.0', count: Math.floor((analytics?.total_alumni || 2000) * 0.25) },
                        { range: '3.0-3.5', count: Math.floor((analytics?.total_alumni || 2000) * 0.35) },
                        { range: '2.5-3.0', count: Math.floor((analytics?.total_alumni || 2000) * 0.25) },
                        { range: '2.0-2.5', count: Math.floor((analytics?.total_alumni || 2000) * 0.15) }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="range" />
                        <YAxis />
                        <Tooltip contentStyle={{ backgroundColor: '#fff', border: '2px solid #10b981', borderRadius: '8px' }} />
                        <Legend />
                        <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} name="Alumni Count" />
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                )}

                {selectedGraph === 'employment' && (
                  <>
                    <h4 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                      Employment Status
                    </h4>
                    <ResponsiveContainer width="100%" height={400}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Employed', value: Math.floor((analytics?.total_alumni || 2000) * 0.85) },
                            { name: 'Seeking', value: Math.floor((analytics?.total_alumni || 2000) * 0.10) },
                            { name: 'Not Seeking', value: Math.floor((analytics?.total_alumni || 2000) * 0.05) }
                          ]}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={130}
                          label
                        >
                          <Cell fill="#3b82f6" />
                          <Cell fill="#fbbf24" />
                          <Cell fill="#ef4444" />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Engagement Tab */}
        {activeTab === 'engagement' && (
          <div className="space-y-6">
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
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
