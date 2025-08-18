import React, { useState, useEffect } from 'react';
import { User, Plus, Search, Filter, LogOut, User as UserIcon, Settings, TestTube } from 'lucide-react';
import { JobApplication, JobApplicationStatus } from './types/JobApplication';
import { User as UserType } from './types/User';
import JobApplicationForm from './components/JobApplicationForm';
import JobApplicationCard from './components/JobApplicationCard';
import EditApplicationModal from './components/EditApplicationModal';
import StatsOverview from './components/StatsOverview';
import AuthForm from './components/AuthForm';
import UserProfile from './components/UserProfile';
import SettingsModal from './components/SettingsModal';
import NetworkStatus from './components/NetworkStatus';
import NotificationTest from './components/NotificationTest';
import { useAuth } from './hooks/useAuth';
import { enhancedJobApplicationService } from './services/enhancedJobApplicationService';
import { useTheme } from './contexts/ThemeContext';
import { enhancedNotificationService } from './services/enhancedNotificationService';
import { settingsService } from './services/settingsService';

function App() {
  const { user, login, register, logout, loading: authLoading } = useAuth();
  const { actualTheme } = useTheme();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobApplicationStatus | 'all'>('all');
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotificationTest, setShowNotificationTest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load applications when user changes
  useEffect(() => {
    if (user) {
      loadApplications();
      setupNotifications();
    } else {
      setApplications([]);
    }
  }, [user]);

  const setupNotifications = async () => {
    if (user) {
      // Request notification permission and setup listeners
      const token = await enhancedNotificationService.requestPermission();
      if (token) {
        await enhancedNotificationService.saveNotificationToken(user.id, token);
      }
      
      // Setup message listener
      enhancedNotificationService.setupMessageListener((payload) => {
        console.log('Received notification:', payload);
      });

      // Setup periodic notifications based on user settings
      try {
        const userSettings = await settingsService.getUserSettings(user.id);
        if (userSettings) {
          enhancedNotificationService.schedulePeriodicNotifications(applications, userSettings);
          enhancedNotificationService.scheduleDeadlineReminders(applications, userSettings);
        }
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    }
  };

  const loadApplications = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    try {
      const apps = await enhancedJobApplicationService.getApplications(user.id);
      setApplications(apps);
    } catch (err) {
      setError('Failed to load applications');
      console.error('Error loading applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddApplication = async (applicationData: Omit<JobApplication, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    try {
      const newApplication = await enhancedJobApplicationService.createApplication(user.id, applicationData);
      setApplications(prev => [newApplication, ...prev]);
      setShowForm(false);
    } catch (err) {
      setError('Failed to add application');
      console.error('Error adding application:', err);
    }
  };

  const handleUpdateApplication = async (id: string, updates: Partial<JobApplication>) => {
    try {
      const updatedApplication = await enhancedJobApplicationService.updateApplication(id, updates);
      setApplications(prev => 
        prev.map(app => app.id === id ? updatedApplication : app)
      );
      setEditingApplication(null);
    } catch (err) {
      setError('Failed to update application');
      console.error('Error updating application:', err);
    }
  };

  const handleDeleteApplication = async (id: string) => {
    try {
      await enhancedJobApplicationService.deleteApplication(id, user?.id || '');
      setApplications(prev => prev.filter(app => app.id !== id));
    } catch (err) {
      setError('Failed to delete application');
      console.error('Error deleting application:', err);
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onLogin={login} onRegister={register} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Job Application Tracker</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowNotificationTest(true)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Test Notifications"
              >
                <TestTube className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              
              <div className="relative">
              <button
                onClick={() => setShowUserProfile(!showUserProfile)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <UserIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{user.name}</span>
              </button>
              
              {showUserProfile && (
                <UserProfile 
                  user={user} 
                  onLogout={logout}
                  onClose={() => setShowUserProfile(false)}
                />
              )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Stats Overview */}
        <StatsOverview applications={applications} />

        {/* Controls */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as JobApplicationStatus | 'all')}
                className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="applied">Applied</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Add Application Button */}
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Application</span>
          </button>
        </div>

        {/* Applications Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading applications...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {applications.length === 0 ? 'No applications yet' : 'No matching applications'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {applications.length === 0 
                ? 'Start tracking your job applications by adding your first one.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {applications.length === 0 && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Your First Application
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredApplications.map((application) => (
              <JobApplicationCard
                key={application.id}
                application={application}
                onEdit={setEditingApplication}
                onDelete={handleDeleteApplication}
              />
            ))}
          </div>
        )}
      </main>

      {/* Network Status */}
      <NetworkStatus onSync={loadApplications} />

      {/* Modals */}
      {showForm && (
        <JobApplicationForm
          onSubmit={handleAddApplication}
          onCancel={() => setShowForm(false)}
        />
      )}

      {editingApplication && (
        <EditApplicationModal
          application={editingApplication}
          onSave={handleUpdateApplication}
          onCancel={() => setEditingApplication(null)}
        />
      )}

      {showSettings && user && (
        <SettingsModal
          userId={user.id}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showNotificationTest && (
        <NotificationTest
          onClose={() => setShowNotificationTest(false)}
        />
      )}
    </div>
  );
}

export default App;