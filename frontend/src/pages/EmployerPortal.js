import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import Sidebar from '../components/Sidebar';
import { Search, Briefcase, LogOut, Mail, Award, Building, GraduationCap, MapPin, DollarSign } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EmployerPortal = ({ user, onLogout }) => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('search');
  
  // Filters
  const [filterMajor, setFilterMajor] = useState('all');
  const [filterIndustry, setFilterIndustry] = useState('all');
  const [filterMinGpa, setFilterMinGpa] = useState('all');
  const [filterExperience, setFilterExperience] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // Filter options
  const [majors, setMajors] = useState([]);
  const [industries, setIndustries] = useState([]);
  
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
      const [majorsRes, industriesRes] = await Promise.all([
        axios.get(`${API}/filters/majors`),
        axios.get(`${API}/filters/industries`)
      ]);
      setMajors(majorsRes.data);
      setIndustries(industriesRes.data);
    } catch (error) {
      console.error('Failed to load filter options');
    }
  };

  const searchCandidates = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterMajor && filterMajor !== 'all') params.major = filterMajor;
      if (filterIndustry && filterIndustry !== 'all') params.industry = filterIndustry;
      if (filterMinGpa) params.min_gpa = parseFloat(filterMinGpa);
      if (filterExperience) params.experience = parseInt(filterExperience);
      if (searchKeyword) params.skills = searchKeyword;
      
      const response = await axios.get(`${API}/employers/search-candidates`, { params });
      setCandidates(response.data);
    } catch (error) {
      toast.error('Failed to search candidates');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilterMajor('all');
    setFilterIndustry('all');
    setFilterMinGpa('all');
    setFilterExperience('all');
    setSearchKeyword('');
    searchCandidates();
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
      badge: candidates.length > 0 ? candidates.length : null
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
          {/* Search & Filters Section */}
          <Card className="p-8 mb-8 bg-white shadow-xl rounded-2xl border-2 border-teal-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Search className="w-8 h-8 text-teal-600" />
                Find Alumni Candidates
              </h2>
              <Button
                onClick={clearFilters}
                variant="outline"
                className="border-2 border-gray-300 hover:bg-gray-50"
              >
                Clear All Filters
              </Button>
            </div>

            {/* Filter Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {/* Major Filter */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-teal-600" />
                  Major / Field of Study
                </label>
                <Select value={filterMajor} onValueChange={setFilterMajor}>
                  <SelectTrigger data-testid="major-filter-select" className="border-2 border-gray-300 focus:border-teal-500 rounded-xl h-12">
                    <SelectValue placeholder="All Majors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Majors</SelectItem>
                    {majors.map((major) => (
                      <SelectItem key={major} value={major}>{major}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Industry Filter */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-600" />
                  Current Industry
                </label>
                <Select value={filterIndustry} onValueChange={setFilterIndustry}>
                  <SelectTrigger data-testid="industry-filter-select" className="border-2 border-gray-300 focus:border-teal-500 rounded-xl h-12">
                    <SelectValue placeholder="All Industries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    {industries.map((industry) => (
                      <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Min GPA Filter */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-600" />
                  Minimum GPA
                </label>
                <Select value={filterMinGpa} onValueChange={setFilterMinGpa}>
                  <SelectTrigger data-testid="gpa-filter-select" className="border-2 border-gray-300 focus:border-teal-500 rounded-xl h-12">
                    <SelectValue placeholder="Any GPA" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any GPA</SelectItem>
                    <SelectItem value="3.5">3.5 and above</SelectItem>
                    <SelectItem value="3.0">3.0 and above</SelectItem>
                    <SelectItem value="2.5">2.5 and above</SelectItem>
                    <SelectItem value="2.0">2.0 and above</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Experience Filter */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  Years of Experience
                </label>
                <Select value={filterExperience} onValueChange={setFilterExperience}>
                  <SelectTrigger data-testid="experience-filter-select" className="border-2 border-gray-300 focus:border-teal-500 rounded-xl h-12">
                    <SelectValue placeholder="Any Experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any Experience</SelectItem>
                    <SelectItem value="0">Entry Level (0-1 years)</SelectItem>
                    <SelectItem value="2">2+ years</SelectItem>
                    <SelectItem value="5">5+ years</SelectItem>
                    <SelectItem value="10">10+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Keyword Search */}
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center gap-2">
                  <Search className="w-4 h-4 text-purple-600" />
                  Keyword Search
                </label>
                <Input
                  data-testid="search-keyword-input"
                  placeholder="Company, title, field..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="border-2 border-gray-300 focus:border-teal-500 rounded-xl h-12"
                />
              </div>

              {/* Search Button */}
              <div className="flex items-end">
                <Button
                  data-testid="search-btn"
                  onClick={searchCandidates}
                  className="w-full h-12 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-xl font-semibold text-lg shadow-lg"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Search
                </Button>
              </div>
            </div>

            {/* Active Filters Display */}
            {(filterMajor || filterIndustry || filterMinGpa || filterExperience || searchKeyword) && (
              <div className="flex items-center gap-3 flex-wrap pt-4 border-t border-gray-200">
                <span className="text-sm font-semibold text-gray-600">Active Filters:</span>
                {filterMajor && filterMajor !== 'all' && (
                  <span className="px-4 py-2 bg-teal-100 text-teal-700 rounded-full text-sm flex items-center gap-2 font-medium">
                    {filterMajor}
                    <button onClick={() => setFilterMajor('')} className="hover:text-teal-900 font-bold">×</button>
                  </span>
                )}
                {filterIndustry && filterIndustry !== 'all' && (
                  <span className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm flex items-center gap-2 font-medium">
                    {filterIndustry}
                    <button onClick={() => setFilterIndustry('')} className="hover:text-emerald-900 font-bold">×</button>
                  </span>
                )}
                {filterMinGpa && (
                  <span className="px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm flex items-center gap-2 font-medium">
                    GPA ≥ {filterMinGpa}
                    <button onClick={() => setFilterMinGpa('')} className="hover:text-amber-900 font-bold">×</button>
                  </span>
                )}
                {filterExperience && (
                  <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2 font-medium">
                    {filterExperience}+ years exp
                    <button onClick={() => setFilterExperience('')} className="hover:text-blue-900 font-bold">×</button>
                  </span>
                )}
                {searchKeyword && (
                  <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-2 font-medium">
                    "{searchKeyword}"
                    <button onClick={() => setSearchKeyword('')} className="hover:text-purple-900 font-bold">×</button>
                  </span>
                )}
              </div>
            )}
          </Card>

          {/* Results Section */}
          {loading ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <p className="text-gray-600 text-lg font-medium">Searching candidates...</p>
            </div>
          ) : candidates.length > 0 ? (
            <>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  Found {candidates.length} {candidates.length === 1 ? 'Candidate' : 'Candidates'}
                </h3>
                <p className="text-gray-600 mt-1">Click on a candidate to view details and send a message</p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {candidates.map((candidate) => (
                  <Card 
                    key={candidate.alumni_id} 
                    data-testid={`candidate-card-${candidate.alumni_id}`}
                    className="p-6 bg-white shadow-lg rounded-2xl hover:shadow-2xl transition-all border-2 border-transparent hover:border-teal-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-xl text-gray-800 mb-2">
                          {candidate.full_name}
                        </h3>
                        <p className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                          <Mail className="w-4 h-4 text-teal-600" />
                          {candidate.email}
                        </p>
                      </div>
                      <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-emerald-400 rounded-full flex items-center justify-center shadow-lg">
                        <Award className="w-7 h-7 text-white" />
                      </div>
                    </div>

                    <div className="space-y-3 mb-5">
                      <div className="flex items-center justify-between p-3 bg-teal-50 rounded-xl">
                        <span className="text-xs text-gray-600 font-medium">Major</span>
                        <span className="font-semibold text-gray-800 text-sm">{candidate.major}</span>
                      </div>
                      
                      {candidate.gpa && (
                        <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                          <span className="text-xs text-gray-600 font-medium">GPA</span>
                          <span className="font-semibold text-gray-800 text-sm">{candidate.gpa}</span>
                        </div>
                      )}
                      
                      {candidate.grad_year && (
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                          <span className="text-xs text-gray-600 font-medium">Graduated</span>
                          <span className="font-semibold text-gray-800 text-sm">{candidate.grad_year}</span>
                        </div>
                      )}
                      
                      {candidate.current_company && (
                        <div className="p-3 bg-emerald-50 rounded-xl">
                          <p className="text-xs text-gray-600 mb-1 font-medium">Current Company</p>
                          <p className="font-semibold text-gray-800 text-sm">{candidate.current_company}</p>
                          {candidate.current_title && (
                            <p className="text-xs text-gray-600 mt-1">{candidate.current_title}</p>
                          )}
                        </div>
                      )}
                      
                      {candidate.industry && (
                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                          <span className="text-xs text-gray-600 font-medium">Industry</span>
                          <span className="font-semibold text-gray-800 text-sm">{candidate.industry}</span>
                        </div>
                      )}
                      
                      {candidate.years_since_grad !== undefined && (
                        <div className="flex items-center justify-between p-3 bg-pink-50 rounded-xl">
                          <span className="text-xs text-gray-600 font-medium">Experience</span>
                          <span className="font-semibold text-gray-800 text-sm">{candidate.years_since_grad} years</span>
                        </div>
                      )}
                    </div>

                    <Button 
                      data-testid={`contact-candidate-${candidate.alumni_id}-btn`}
                      onClick={() => handleContactCandidate(candidate)}
                      className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-xl h-12 font-semibold shadow-lg"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Contact Candidate
                    </Button>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Briefcase className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">No Candidates Found</h3>
              <p className="text-gray-600 text-lg mb-6">Try adjusting your search criteria to find more candidates</p>
              <Button
                onClick={clearFilters}
                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white px-8 py-6 rounded-xl font-semibold text-lg"
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Contact Candidate Modal */}
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold gradient-text">
              Contact Candidate
            </DialogTitle>
          </DialogHeader>
          {selectedCandidate && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl border-2 border-teal-200">
                <h4 className="font-bold text-gray-800 text-lg mb-1">{selectedCandidate.full_name}</h4>
                <p className="text-sm text-gray-600 mb-1">{selectedCandidate.email}</p>
                <p className="text-sm text-gray-600">{selectedCandidate.major} • Class of {selectedCandidate.grad_year}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Subject *</label>
                <Input
                  data-testid="contact-subject-input"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                  className="border-2 border-gray-200 focus:border-teal-500 rounded-xl"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Job Title</label>
                <Input
                  data-testid="contact-jobtitle-input"
                  value={contactForm.job_title}
                  onChange={(e) => setContactForm({...contactForm, job_title: e.target.value})}
                  placeholder="e.g., Senior Software Engineer"
                  className="border-2 border-gray-200 focus:border-teal-500 rounded-xl"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Message *</label>
                <textarea
                  data-testid="contact-message-input"
                  value={contactForm.message}
                  onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                  rows={8}
                  className="w-full border-2 border-gray-200 focus:border-teal-500 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <Button
                data-testid="contact-submit-btn"
                onClick={submitContactMessage}
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white py-6 rounded-xl font-semibold"
              >
                <Mail className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployerPortal;
