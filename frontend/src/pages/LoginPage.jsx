import React, { useState } from 'react';
import {
  Shield,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  ArrowRight,
  UserCheck,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [role, setRole] = useState('citizen'); // 'collector' | 'citizen'
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    district: 'Madurai',
    mandal: ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Email and password are required.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      if (mode === 'login') {
        await login(formData.email, formData.password);
      } else {
        await register({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          role,
          phone: formData.phone,
          district: formData.district,
          mandal: formData.mandal
        });
      }
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Invalid credentials. Please try again.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (email, password, selectedRole) => {
    setFormData(prev => ({ ...prev, email, password }));
    setRole(selectedRole);
    setMode('login');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 fimms-background flex flex-col">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-500 flex items-center justify-center shadow-md text-white">
          <Shield className="w-5 h-5" />
        </div>
        <span className="text-xl font-extrabold tracking-tight text-slate-900">FIMMS</span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          Collector's Unified Application
        </span>
      </div>

      <div className="flex flex-1 items-start justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">

          {/* Role Selector */}
          <div className="bg-white rounded-2xl border border-slate-200 p-1.5 flex shadow-sm">
            {[
              { id: 'collector', label: 'District Collector / Officer', icon: Shield },
              { id: 'citizen', label: 'Citizen / Resident', icon: UserCheck }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setRole(id); setError(''); }}
                className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  role === id
                    ? id === 'collector'
                      ? 'bg-blue-900 text-white shadow-sm'
                      : 'bg-emerald-700 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
            {/* Title */}
            <div className="text-center space-y-1">
              <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg mb-3 ${
                role === 'collector'
                  ? 'bg-gradient-to-tr from-blue-700 to-indigo-500'
                  : 'bg-gradient-to-tr from-emerald-600 to-teal-500'
              } text-white`}>
                {role === 'collector' ? <Shield className="w-7 h-7" /> : <UserCheck className="w-7 h-7" />}
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                {mode === 'login' ? 'Sign In' : 'Create Account'}
              </h2>
              <p className="text-sm text-slate-500">
                {role === 'collector'
                  ? 'Access the FIMMS Collectorate Command Suite'
                  : 'Lodge and track your civic grievances'}
              </p>
            </div>

            {/* Mode Tabs */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => { setMode('login'); setError(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  mode === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setMode('register'); setError(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  mode === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                Register
              </button>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="flex items-center space-x-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-xs font-semibold text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name</label>
                  <input
                    name="full_name"
                    type="text"
                    required
                    placeholder="e.g. K. Srinivas Reddy"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="you@district.gov.in"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone (Optional)</label>
                    <input
                      name="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Mandal (Optional)</label>
                    <input
                      name="mandal"
                      type="text"
                      placeholder="e.g. Bhongiri"
                      value={formData.mandal}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center space-x-2 transition-all shadow-md ${
                  role === 'collector'
                    ? 'bg-blue-900 hover:bg-blue-800 shadow-blue-900/20'
                    : 'bg-emerald-700 hover:bg-emerald-600 shadow-emerald-700/20'
                } disabled:opacity-60`}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : mode === 'login' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to FIMMS</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Logins */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider text-center">
                Demo Quick Access
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => quickFill('collector@fimms.gov.in', 'admin123', 'collector')}
                  className="px-3 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 text-[11px] font-bold rounded-xl border border-blue-100 text-left space-y-0.5 transition-colors"
                >
                  <p className="flex items-center space-x-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Collector Demo</span>
                  </p>
                  <p className="text-blue-600 opacity-70 ml-5">Full FIMMS Suite Access</p>
                </button>

                <button
                  onClick={() => quickFill('citizen@fimms.gov.in', 'citizen123', 'citizen')}
                  className="px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-xl border border-emerald-100 text-left space-y-0.5 transition-colors"
                >
                  <p className="flex items-center space-x-1.5">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Citizen Demo</span>
                  </p>
                  <p className="text-emerald-600 opacity-70 ml-5">Grievance Portal Access</p>
                </button>
              </div>
              <p className="text-center text-[10px] text-slate-400 font-medium">
                Click a demo button above, then click "Sign In to FIMMS"
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-400 font-medium">
            FIMMS — Collector's Unified Application &nbsp;•&nbsp; Madurai District
          </p>
        </div>
      </div>
    </div>
  );
}
