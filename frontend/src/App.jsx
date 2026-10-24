import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import CitizenDashboard from './pages/CitizenDashboard';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import EntitiesPage from './pages/EntitiesPage';
import UserManagementPage from './pages/UserManagementPage';
import ReportsPage from './pages/ReportsPage';
import { Loader2 } from 'lucide-react';

function CollectorApp() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard':   return <DashboardPage />;
      case 'entities':    return <EntitiesPage />;
      case 'users':       return <UserManagementPage />;
      case 'reports':     return <ReportsPage />;
      default:            return <DashboardPage />;
    }
  };

  return (
    <div className="min-h-screen fimms-background">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main>{renderTab()}</main>
    </div>
  );
}

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-500 flex items-center justify-center shadow-xl">
          <Loader2 className="w-7 h-7 text-white animate-spin" />
        </div>
        <p className="text-sm text-slate-500 font-semibold">Initializing FIMMS Command System...</p>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  // Collector roles get the full FIMMS Collectorate Suite
  if (['collector', 'field_officer', 'hod', 'admin'].includes(user.role)) {
    return <CollectorApp />;
  }

  // Citizens get the grievance portal
  return <CitizenDashboard />;
}

export default App;
