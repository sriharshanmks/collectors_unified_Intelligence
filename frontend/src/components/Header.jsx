import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  FileText, 
  Shield, 
  Bell, 
  LogOut, 
  UserCheck, 
  MapPin, 
  Cpu, 
  ChevronDown 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header({ activeTab, setActiveTab }) {
  const { user, logout, login } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'entities', label: 'Entities', icon: Building2 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  const handleRoleSwitch = async (targetRole) => {
    try {
      if (targetRole === 'collector') {
        await login('collector@fimms.gov.in', 'admin123');
      } else {
        await login('citizen@fimms.gov.in', 'citizen123');
      }
      setProfileDropdownOpen(false);
    } catch (err) {
      console.error('Role switch error:', err);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'AD';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
              <Shield className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-2xl font-extrabold tracking-tight text-slate-900 font-sans">
                FIMMS
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Collectorate Portal
              </span>
            </div>
          </div>

          {/* Navigation Tabs (Collector View) */}
          {user?.role === 'collector' ? (
            <nav className="hidden md:flex items-center space-x-1 bg-slate-100/80 p-1 rounded-full border border-slate-200">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          ) : (
            <div className="hidden md:flex items-center space-x-2">
              <span className="text-sm font-medium text-slate-600">
                Citizen Grievance Redressal & Transparency Map
              </span>
            </div>
          )}

          {/* Right Action Icons & Profile */}
          <div className="flex items-center space-x-4">
            
            {/* 99+ Notifications Badge (from Screenshot) */}
            <div className="relative cursor-pointer" title="99+ Critical & Pending Alerts">
              <button className="flex items-center justify-center p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                <Bell className="w-5 h-5" />
              </button>
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-bold text-[10px] px-1.5 py-0.2 rounded-full shadow-xs">
                99+
              </span>
            </div>

            {/* User Avatar Circle "AD" (from Screenshot) with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2 focus:outline-hidden"
              >
                <div className="w-9 h-9 rounded-full bg-blue-900 text-white flex items-center justify-center text-sm font-bold shadow-xs hover:ring-2 hover:ring-blue-500 transition-all">
                  {getInitials(user?.full_name)}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold text-slate-900 leading-tight">
                    {user?.full_name?.split(',')[0] || 'Anudeep D.'}
                  </p>
                  <p className="text-[10px] font-medium text-slate-500 capitalize">
                    {user?.role === 'collector' ? 'District Collector' : 'Citizen'}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
              </button>

              {/* Profile / Role Switcher Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900">{user?.full_name}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                      Role: {user?.role}
                    </span>
                  </div>

                  <div className="px-2 py-2">
                    <p className="text-[10px] uppercase font-bold text-slate-400 px-2 mb-1">
                      Quick Role Switch (Pair Programming Test)
                    </p>
                    
                    <button
                      onClick={() => handleRoleSwitch('collector')}
                      className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-left ${
                        user?.role === 'collector'
                          ? 'bg-blue-50 text-blue-800 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5 text-blue-600" />
                      <span>Switch to District Collector (FIMMS Suite)</span>
                    </button>

                    <button
                      onClick={() => handleRoleSwitch('citizen')}
                      className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-left ${
                        user?.role === 'citizen'
                          ? 'bg-emerald-50 text-emerald-800 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Switch to Citizen Portal (Lodge Grievance)</span>
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-1 px-2">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
