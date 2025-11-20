import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Users, TrendingUp, Award, Heart, BarChart3, UserCheck } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Landing = ({ onLogin, user }) => {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('alumni');
  const [loading, setLoading] = useState(false);
  
  // Registration fields
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [major, setMajor] = useState('');
  const [gradYear, setGradYear] = useState('');
  const [companyName, setCompanyName] = useState('');
  
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/login`, { email, role });
      const { token, user: userData } = response.data;
      
      onLogin(userData, token);
      toast.success('Login successful!');
      setShowAuth(false);
      
      // Navigate based on role
      if (role === 'alumni') navigate('/alumni');
      else if (role === 'admin') navigate('/admin');
      else if (role === 'employer') navigate('/employer');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (role === 'alumni' && (!major || !gradYear)) {
      toast.error('Please fill in major and graduation year');
      return;
    }

    if (role === 'employer' && !companyName) {
      toast.error('Please enter company name');
      return;
    }

    setLoading(true);
    try {
      const registrationData = {
        full_name: fullName,
        email,
        password,
        role,
        ...(role === 'alumni' && { major, grad_year: parseInt(gradYear) }),
        ...(role === 'employer' && { company_name: companyName })
      };

      await axios.post(`${API}/auth/register`, registrationData);
      toast.success('Registration successful! Please login.');
      
      // Switch to login mode
      setAuthMode('login');
      setPassword('');
      setFullName('');
      setMajor('');
      setGradYear('');
      setCompanyName('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return null; // Will be redirected by App.js
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '1s'}} />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '2s'}} />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="glass-card p-12 max-w-5xl mx-auto">
            <div className="inline-block mb-6">
              <div className="flex items-center gap-3 bg-gradient-to-r from-teal-50 to-emerald-50 px-6 py-3 rounded-full border border-teal-200">
                <Award className="w-5 h-5 text-teal-600" />
                <span className="text-sm font-medium text-teal-700">Global Horizon University</span>
              </div>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 gradient-text leading-tight">
              Alumni Connect
              <br />
              Analytics Platform
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
              Transforming alumni engagement through data-driven insights. Connect with 70,000+ graduates, discover mentorship opportunities, and unlock powerful analytics.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                data-testid="get-started-btn"
                onClick={() => setShowAuth(true)}
                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white px-8 py-6 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                Get Started
              </Button>
              <Button 
                variant="outline"
                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                className="border-2 border-teal-500 text-teal-700 hover:bg-teal-50 px-8 py-6 rounded-full text-lg font-semibold transition-all"
              >
                Learn More
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-teal-600 mb-1">70,000+</div>
                <div className="text-sm text-gray-600">Alumni</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600 mb-1">500+</div>
                <div className="text-sm text-gray-600">Companies</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-teal-600 mb-1">1,200+</div>
                <div className="text-sm text-gray-600">Mentors</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600 mb-1">95%</div>
                <div className="text-sm text-gray-600">Engagement</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-bold text-center mb-4 gradient-text">
            Powerful Features
          </h2>
          <p className="text-center text-gray-600 mb-16 text-lg">Everything you need for alumni success</p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-8 hover:shadow-2xl transition-all border-2 border-transparent hover:border-teal-200 rounded-2xl">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-emerald-400 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Alumni Directory</h3>
              <p className="text-gray-600 leading-relaxed">
                Comprehensive database of 70,000+ alumni with advanced search and filtering capabilities.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-2xl transition-all border-2 border-transparent hover:border-emerald-200 rounded-2xl">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-2xl flex items-center justify-center mb-6">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Analytics Dashboard</h3>
              <p className="text-gray-600 leading-relaxed">
                Real-time insights on engagement, employment trends, and alumni success metrics.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-2xl transition-all border-2 border-transparent hover:border-teal-200 rounded-2xl">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-emerald-400 rounded-2xl flex items-center justify-center mb-6">
                <UserCheck className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Mentorship Program</h3>
              <p className="text-gray-600 leading-relaxed">
                AI-powered matching system connecting students with experienced alumni mentors.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-2xl transition-all border-2 border-transparent hover:border-emerald-200 rounded-2xl">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-2xl flex items-center justify-center mb-6">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Predictive Analytics</h3>
              <p className="text-gray-600 leading-relaxed">
                Machine learning models predict donor likelihood and engagement patterns.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-2xl transition-all border-2 border-transparent hover:border-teal-200 rounded-2xl">
              <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-emerald-400 rounded-2xl flex items-center justify-center mb-6">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Fundraising Tools</h3>
              <p className="text-gray-600 leading-relaxed">
                Targeted campaigns with donor prediction and engagement tracking.
              </p>
            </Card>

            <Card className="p-8 hover:shadow-2xl transition-all border-2 border-transparent hover:border-emerald-200 rounded-2xl">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-2xl flex items-center justify-center mb-6">
                <Award className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Career Services</h3>
              <p className="text-gray-600 leading-relaxed">
                Job postings, career fairs, and employer networking opportunities.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center glass-card p-12 rounded-3xl">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 gradient-text">
            Ready to Connect?
          </h2>
          <p className="text-xl text-gray-700 mb-8">
            Join thousands of alumni already engaging with GHU community
          </p>
          <Button 
            data-testid="cta-login-btn"
            onClick={() => setShowAuth(true)}
            className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white px-10 py-6 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            Login Now
          </Button>
        </div>
      </section>

      {/* Auth Modal */}
      <Dialog open={showAuth} onOpenChange={setShowAuth}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center gradient-text">
              {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
            </DialogTitle>
          </DialogHeader>
          
          {/* Toggle Login/Register */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
            <button
              data-testid="login-mode-btn"
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                authMode === 'login'
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Login
            </button>
            <button
              data-testid="register-mode-btn"
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                authMode === 'register'
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Register
            </button>
          </div>

          <div className="space-y-4 py-4">
            {/* Role Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Role</label>
              <div className="grid grid-cols-3 gap-2">
                {['alumni', 'admin', 'employer'].map((r) => (
                  <button
                    key={r}
                    data-testid={`role-${r}-btn`}
                    onClick={() => setRole(r)}
                    className={`py-2 px-3 rounded-xl border-2 font-medium capitalize transition-all text-sm ${
                      role === r
                        ? 'bg-teal-50 border-teal-500 text-teal-700'
                        : 'border-gray-200 text-gray-600 hover:border-teal-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Registration Fields */}
            {authMode === 'register' && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Full Name *</label>
                  <Input
                    data-testid="fullname-input"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="border-2 border-gray-200 focus:border-teal-500 rounded-xl"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Password *</label>
                  <Input
                    data-testid="password-input"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-2 border-gray-200 focus:border-teal-500 rounded-xl"
                  />
                </div>

                {role === 'alumni' && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Major *</label>
                      <Input
                        data-testid="major-input"
                        type="text"
                        placeholder="Computer Science"
                        value={major}
                        onChange={(e) => setMajor(e.target.value)}
                        className="border-2 border-gray-200 focus:border-teal-500 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Graduation Year *</label>
                      <Input
                        data-testid="gradyear-input"
                        type="number"
                        placeholder="2020"
                        value={gradYear}
                        onChange={(e) => setGradYear(e.target.value)}
                        className="border-2 border-gray-200 focus:border-teal-500 rounded-xl"
                      />
                    </div>
                  </>
                )}

                {role === 'employer' && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Company Name *</label>
                    <Input
                      data-testid="company-input"
                      type="text"
                      placeholder="Tech Corp"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="border-2 border-gray-200 focus:border-teal-500 rounded-xl"
                    />
                  </div>
                )}
              </>
            )}
            
            {/* Email Field (for both login and register) */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Email *</label>
              <Input
                data-testid="email-input"
                type="email"
                placeholder="your.email@example.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (authMode === 'login' ? handleLogin() : handleRegister())}
                className="border-2 border-gray-200 focus:border-teal-500 rounded-xl"
              />
              {authMode === 'login' && role === 'alumni' && (
                <p className="text-xs text-gray-500 mt-2">
                  Example: student_1178@alumni.example.org
                </p>
              )}
            </div>
            
            {/* Submit Button */}
            <Button
              data-testid={authMode === 'login' ? 'login-submit-btn' : 'register-submit-btn'}
              onClick={authMode === 'login' ? handleLogin : handleRegister}
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white py-6 rounded-xl font-semibold text-lg transition-all"
            >
              {loading ? (authMode === 'login' ? 'Logging in...' : 'Registering...') : (authMode === 'login' ? 'Continue' : 'Create Account')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Landing;
