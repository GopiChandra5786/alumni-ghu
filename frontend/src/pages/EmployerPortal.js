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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    searchCandidates();
  }, []);

  const searchCandidates = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.skills = searchTerm;
      if (filterMajor) params.major = filterMajor;
      
      const response = await axios.get(`${API}/employers/search-candidates`, { params });
      setCandidates(response.data);
    } catch (error) {
      toast.error('Failed to search candidates');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold gradient-text">Employer Portal</h1>
            <p className="text-sm text-gray-600">Welcome, {user.company_name || user.email}</p>
          </div>
          <Button 
            data-testid="employer-logout-btn"
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
        {/* Search Section */}
        <Card className="p-6 mb-8 bg-white shadow-lg rounded-2xl">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Search Candidates</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Input
              data-testid="search-skills-input"
              placeholder="Search by skills or field..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-2 border-gray-200 focus:border-teal-500 rounded-xl"
            />
            <Input
              data-testid="filter-major-input"
              placeholder="Filter by major..."
              value={filterMajor}
              onChange={(e) => setFilterMajor(e.target.value)}
              className="border-2 border-gray-200 focus:border-teal-500 rounded-xl"
            />
            <Button
              data-testid="search-btn"
              onClick={searchCandidates}
              className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-xl font-semibold"
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
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
