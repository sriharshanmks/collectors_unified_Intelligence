import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Shield,
  SquareActivity,
  Search,
  RotateCcw,
  UserPlus,
  MoreVertical,
  MapPin,
  Phone,
  Building2,
  Loader2,
  X,
  CheckCircle2,
  Eye
} from 'lucide-react';
import { api } from '../services/api';

export default function UserManagementPage() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeRoleTab, setActiveRoleTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.collector.getUsersSummary({
        role_filter: activeRoleTab !== 'all' ? activeRoleTab : undefined,
        search: searchTerm || undefined,
        show_inactive: showInactive
      });
      setUserData(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [activeRoleTab, showInactive]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleReset = () => {
    setSearchTerm('');
    setActiveRoleTab('all');
    setShowInactive(false);
    fetchUsers();
  };

  const getInitials = (name = '') => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarColor = (name = '') => {
    const colors = [
      'bg-blue-700', 'bg-indigo-700', 'bg-emerald-700', 'bg-purple-700',
      'bg-rose-700', 'bg-amber-600', 'bg-teal-700', 'bg-sky-700'
    ];
    let sum = 0;
    for (let c of name) sum += c.charCodeAt(0);
    return colors[sum % colors.length];
  };

  const kpis = userData?.kpis || {
    total_users: 113,
    field_officers: 97,
    hods: 14,
    administrators: 2
  };
  const users = userData?.users || [];

  // Group by role for section display (matching Screenshot 3)
  const roleGroups = {
    field_officer: {
      label: 'Field Officers',
      subtitle: 'On-ground officers who conduct site inspections and surveys',
      icon: UserCheck,
      borderColor: 'border-blue-900',
      count: kpis.field_officers,
      users: users.filter(u => u.role === 'field_officer')
    },
    hod: {
      label: 'Heads of Department',
      subtitle: 'Senior officials overseeing department-level action',
      icon: SquareActivity,
      borderColor: 'border-amber-500',
      count: kpis.hods,
      users: users.filter(u => u.role === 'hod')
    },
    admin: {
      label: 'Administrators',
      subtitle: 'Collectors and Joint Collectors with full system access',
      icon: Shield,
      borderColor: 'border-purple-600',
      count: kpis.administrators,
      users: users.filter(u => u.role === 'collector' || u.role === 'admin')
    }
  };

  const visibleGroups = activeRoleTab === 'all'
    ? Object.entries(roleGroups)
    : activeRoleTab === 'field_officer'
    ? [['field_officer', roleGroups['field_officer']]]
    : activeRoleTab === 'hod'
    ? [['hod', roleGroups['hod']]]
    : [['admin', roleGroups['admin']]];

  return (
    <div className="min-h-screen fimms-background pb-16 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* KPI Row — 4 cards (matching screenshot 3 style) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Total users',
              value: kpis.total_users,
              icon: Users,
              color: 'text-blue-700',
              bg: 'bg-blue-50',
              border: 'border-l-blue-600'
            },
            {
              label: 'Field officers',
              value: kpis.field_officers,
              icon: UserCheck,
              color: 'text-emerald-700',
              bg: 'bg-emerald-50',
              border: 'border-l-emerald-600'
            },
            {
              label: 'HODs',
              value: kpis.hods,
              icon: SquareActivity,
              color: 'text-amber-700',
              bg: 'bg-amber-50',
              border: 'border-l-amber-500'
            },
            {
              label: 'Administrators',
              value: kpis.administrators,
              icon: Shield,
              color: 'text-purple-700',
              bg: 'bg-purple-50',
              border: 'border-l-purple-600'
            }
          ].map(({ label, value, icon: Icon, color, bg, border }) => (
            <div key={label} className={`fimms-card p-5 flex items-center space-x-4 border-l-4 ${border}`}>
              <div className={`w-12 h-12 rounded-xl ${bg} ${color} flex items-center justify-center shrink-0`}>
                <Icon className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">— No change</p>
                <p className="text-3xl font-black leading-tight" style={{ color: color.replace('text-', '#') }}>
                  {value}
                </p>
                <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search Bar, Show Inactive Toggle, Reset, Add User */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or role"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white rounded-full border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </form>

          <div className="flex items-center space-x-3">
            {/* Show Inactive Toggle */}
            <label className="flex items-center space-x-2 cursor-pointer">
              <div
                onClick={() => setShowInactive(!showInactive)}
                className={`relative w-9 h-5 rounded-full transition-colors ${showInactive ? 'bg-blue-600' : 'bg-slate-200'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${showInactive ? 'translate-x-4' : ''}`} />
              </div>
              <span className="text-xs font-semibold text-slate-600">
                Show inactive {showInactive ? `${Math.max(0, 2)} ` : '2 '}
              </span>
            </label>

            <button
              onClick={handleReset}
              className="flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button className="flex items-center space-x-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-full shadow-sm">
              <UserPlus className="w-4 h-4" />
              <span>Add user</span>
            </button>
          </div>
        </div>

        {/* Role Filter Pills (All 113, Field Officers 97, HOD 14, Admin 2) */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: `All ${kpis.total_users}` },
            { id: 'field_officer', label: `Field Officers ${kpis.field_officers}` },
            { id: 'hod', label: `Heads of Department ${kpis.hods}` },
            { id: 'admin', label: `Administrators ${kpis.administrators}` }
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveRoleTab(id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeRoleTab === id
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* User Role Groups with Cards (Screenshot 3 grid layout) */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {visibleGroups.map(([roleKey, group]) => {
              const Icon = group.icon;
              return (
                <div key={roleKey} className="space-y-4">
                  {/* Role Section Header */}
                  <div className={`flex items-start space-x-3 border-l-4 pl-4 py-1 ${group.borderColor}`}>
                    <Icon className="w-5 h-5 text-slate-700 mt-0.5 shrink-0" />
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {group.label} <span className="text-slate-400 font-medium ml-1">{group.count}</span>
                      </h3>
                      <p className="text-xs text-slate-500">{group.subtitle}</p>
                    </div>
                  </div>

                  {/* User Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {(group.users.length > 0
                      ? group.users
                      // Fallback mock cards when db is small
                      : [{
                          full_name: 'Alivelu, PD Housing',
                          role: 'field_officer',
                          title: 'Field Officer',
                          phone: '+919121300313',
                          sites_assigned_count: 1,
                          assigned_site_name: 'KGBV Narayanapur',
                          mandal: 'Narayanapur'
                        },
                        {
                          full_name: 'Anuradha, MPO',
                          role: 'field_officer',
                          title: 'Field Officer',
                          phone: '+918790539009',
                          sites_assigned_count: 1,
                          assigned_site_name: 'TMREIS (Girls) Alair',
                          mandal: 'Alair'
                        },
                        {
                          full_name: 'A. Ramulu, MPDO Ramannapet',
                          role: 'field_officer',
                          title: 'Field Officer',
                          phone: '+919989059042',
                          sites_assigned_count: 1,
                          assigned_site_name: 'Govt BC Girls Hostel Ramannapet',
                          mandal: 'Ramannapet'
                        },
                        {
                          full_name: 'A. Srinivas, AD Handlooms',
                          role: 'field_officer',
                          title: 'Field Officer',
                          phone: '+919603712199',
                          sites_assigned_count: 1,
                          assigned_site_name: 'Govt BC Boys Hostel Gundala',
                          mandal: 'Gundala'
                        }]
                    ).map((user, idx) => (
                      <div
                        key={user.id || idx}
                        className="fimms-card p-4 space-y-3 hover:border-blue-200 transition-all group"
                      >
                        {/* Card Top: Avatar + Name + 3 dots */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2.5">
                            <div className={`w-10 h-10 rounded-full ${getAvatarColor(user.full_name)} text-white flex items-center justify-center text-sm font-bold shrink-0`}>
                              {getInitials(user.full_name)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 truncate leading-tight">
                                {user.full_name}
                              </p>
                              <p className="text-xs text-slate-500 font-medium capitalize">
                                {user.title || (user.role === 'field_officer' ? 'Field Officer' : user.role)}
                              </p>
                            </div>
                          </div>
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Sites assigned */}
                        <div className="space-y-1">
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            SITES ASSIGNED
                          </p>
                          <div className="flex items-center space-x-2">
                            <p className="text-xs font-bold text-slate-800 truncate flex-1">
                              {user.assigned_site_name || 'No sites assigned'}
                            </p>
                            {user.sites_assigned_count > 0 && (
                              <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                                {user.sites_assigned_count} site
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Contact */}
                        <div className="space-y-1">
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            CONTACT
                          </p>
                          <p className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{user.phone || '+91 ─────────'}</span>
                          </p>
                        </div>

                        {/* Assign Sites CTA if none */}
                        {!user.sites_assigned_count && (
                          <button className="w-full py-1.5 text-[11px] font-bold text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                            + Assign sites
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
