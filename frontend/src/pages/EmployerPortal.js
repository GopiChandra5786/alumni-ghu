import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import Sidebar from '../components/Sidebar';
import { Search, Briefcase, LogOut, Mail, MapPin, Award, Users, Filter } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EmployerPortal = ({ user, onLogout }) => {
  const [candidates, setCandidates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMajor, setFilterMajor] = useState('');
  const [filterSkill, setFilterSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('search');
  
  // Filter options
  const [majors, setMajors] = useState([]);
  const [skills, setSkills] = useState([]);
  
  // Contact Modal
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [contactForm, setContactForm] = useState({
    subject: '',
    job_title: '',
    message: ''
  });

  useEffect(() => {
    searchCandidates();
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      const [majorsRes, skillsRes] = await Promise.all([
        axios.get(`${API}/filters/majors`),
        axios.get(`${API}/filters/skills`)
      ]);
      setMajors(majorsRes.data);
      setSkills(skillsRes.data);
    } catch (error) {
      console.error('Failed to load filter options');
    }
  };

  const searchCandidates = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.skills = searchTerm;
      if (filterMajor) params.major = filterMajor;
      if (filterSkill) params.skills = filterSkill;
      
      const response = await axios.get(`${API}/employers/search-candidates`, { params });
      setCandidates(response.data);
    } catch (error) {
      toast.error('Failed to search candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleContactCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    setContactForm({
      subject: `Job Opportunity at ${user.company_name || 'Our Company'}`,
      job_title: '',
      message: `Dear ${candidate.full_name},\n\nWe came across your profile on the GHU Alumni Network and are impressed with your background in ${candidate.major}.\n\nWe have an exciting opportunity at ${user.company_name || 'our company'} that we believe would be a great fit for your skills and experience.\n\nWould you be interested in learning more about this position?\n\nBest regards,\n${user.full_name || user.email}`
    });
    setShowContactModal(true);
  };

  const submitContactMessage = async () => {
    if (!contactForm.subject || !contactForm.message) {
      toast.error('Please fill in subject and message');
      return;
    }

    try {
      await axios.post(`${API}/employers/contact-candidate`, {
        employer_email: user.email,
        employer_name: user.full_name || user.email,
        company_name: user.company_name || 'Company',
        candidate_id: selectedCandidate.alumni_id,
        candidate_email: selectedCandidate.email,
        subject: contactForm.subject,
        message: contactForm.message,
        job_title: contactForm.job_title
      });
      
      toast.success('Message sent successfully!');
      setShowContactModal(false);
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const sidebarItems = [
    {
      id: 'search',
      label: 'Search Candidates',
      icon: Search,
      active: activeTab === 'search',
      onClick: () => setActiveTab('search'),
      testId: 'search-tab',
      badge: candidates.length
    },
    {
      id: 'filters',
      label: 'Advanced Filters',
      icon: Filter,
      active: activeTab === 'filters',
      onClick: () => setActiveTab('filters'),
      testId: 'filters-tab'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50 flex">
      {/* Sidebar */}
      <Sidebar
        header={{
          title: 'Employer Portal',
          subtitle: user.company_name || user.email
        }}
        items={sidebarItems}
        onLogout={onLogout}
      />

      {/* Main Content */}
      <div className="flex-1 ml-64 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Section */}
        <Card className="p-6 mb-8 bg-white shadow-lg rounded-2xl">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-3">
            <Search className="w-7 h-7 text-teal-600" />
            Search Candidates
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Major</label>
              <Select value={filterMajor} onValueChange={setFilterMajor}>
                <SelectTrigger data-testid="major-filter-select" className="border-2 border-gray-200 focus:border-teal-500 rounded-xl">
                  <SelectValue placeholder="Select Major" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Majors</SelectItem>
                  {majors.map((major) => (
                    <SelectItem key={major} value={major}>{major}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Skills</label>
              <Select value={filterSkill} onValueChange={setFilterSkill}>
                <SelectTrigger data-testid="skill-filter-select" className="border-2 border-gray-200 focus:border-teal-500 rounded-xl">
                  <SelectValue placeholder="Select Skill" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Skills</SelectItem>
                  {skills.map((skill) => (
                    <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Keyword Search</label>
              <Input
                data-testid="search-skills-input"
                placeholder="Search keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-2 border-gray-200 focus:border-teal-500 rounded-xl"
              />
            </div>

            <div className="flex items-end">
              <Button
                data-testid="search-btn"
                onClick={searchCandidates}
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-xl font-semibold"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </div>

          {(filterMajor || filterSkill || searchTerm) && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-600">Active Filters:</span>
              {filterMajor && (
                <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm flex items-center gap-2">
                  {filterMajor}
                  <button onClick={() => setFilterMajor('')} className="hover:text-teal-900">×</button>
                </span>
              )}
              {filterSkill && (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm flex items-center gap-2">
                  {filterSkill}
                  <button onClick={() => setFilterSkill('')} className="hover:text-emerald-900">×</button>
                </span>
              )}
              {searchTerm && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2">
                  {searchTerm}
                  <button onClick={() => setSearchTerm('')} className="hover:text-blue-900">×</button>
                </span>
              )}
            </div>
          )}
        </Card>

        {/* Candidates Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Searching candidates...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {candidates.map((candidate) => (
              <Card 
                key={candidate.alumni_id} 
                data-testid={`candidate-card-${candidate.alumni_id}`}
                className="p-6 bg-white shadow-lg rounded-2xl hover:shadow-xl transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-800 mb-1">
                      {candidate.full_name}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {candidate.email}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-emerald-400 rounded-full flex items-center justify-center">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Major</p>
                    <p className="font-semibold text-gray-800">{candidate.major}</p>
                  </div>
                  {candidate.gpa && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">GPA</p>
                      <p className="font-semibold text-gray-800">{candidate.gpa}</p>
                    </div>
                  )}
                  {candidate.current_company && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Current Company</p>
                      <p className="font-semibold text-gray-800">{candidate.current_company}</p>
                    </div>
                  )}
                  {candidate.years_since_grad && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Experience</p>
                      <p className="font-semibold text-gray-800">{candidate.years_since_grad} years</p>
                    </div>
                  )}
                </div>

                <Button 
                  data-testid={`contact-candidate-${candidate.alumni_id}-btn`}
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white rounded-xl"
                >
                  Contact Candidate
                </Button>
              </Card>
            ))}
          </div>
        )}

        {!loading && candidates.length === 0 && (
          <div className="text-center py-16">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No candidates found. Try adjusting your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployerPortal;
