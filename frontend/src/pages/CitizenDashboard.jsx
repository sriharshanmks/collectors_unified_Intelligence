import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Loader2,
  FileText,
  Plus,
  X,
  Camera,
  Navigation,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Header from '../components/Header';
import DistrictMap from '../components/DistrictMap';

const CATEGORIES = [
  'Water & Sanitation',
  'Roads & Infrastructure',
  'Health & Medical',
  'Education',
  'Electricity / Power',
  'Hostels & Welfare',
  'Agriculture & Irrigation',
  'Public Safety',
  'Other'
];

const MANDALS = [
  'Madurai North', 'Madurai South', 'Thiruparankundram', 'Melur', 'Vadipatti',
  'Usilampatti', 'Thirumangalam', 'Alanganallur', 'Sholavandan', 'Madurai East',
  'Madurai West', 'Peraiyur', 'Kallikudi', 'Sedapatti', 'Chellampatti',
  'T. Kallupatti', 'Kottampatti', 'Othakadai', 'Samayanallur'
];

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'lodge' | 'my_complaints'

  const [myComplaints, setMyComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);

  // Lodge form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Water & Sanitation',
    mandal: 'Madurai North',
    village: '',
    latitude: null,
    longitude: null,
    image_url: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [formError, setFormError] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);

  const fetchComplaints = async () => {
    try {
      setLoadingComplaints(true);
      const data = await api.complaints.getMy();
      setMyComplaints(data);
    } catch (err) {
      console.error('Error fetching complaints:', err);
    } finally {
      setLoadingComplaints(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'my_complaints') fetchComplaints();
  }, [activeTab]);

  const handleGeoDetect = () => {
    if (!navigator.geolocation) {
      setFormError('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(prev => ({
          ...prev,
          latitude: parseFloat(pos.coords.latitude.toFixed(6)),
          longitude: parseFloat(pos.coords.longitude.toFixed(6))
        }));
        setGeoLoading(false);
      },
      () => {
        setFormError('Could not detect your location. Please allow location access or enter coordinates manually.');
        setGeoLoading(false);
      }
    );
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setFormError('Title and description are required.');
      return;
    }
    try {
      setSubmitting(true);
      setFormError('');
      const result = await api.complaints.submit({
        ...form,
        latitude: form.latitude || 17.5113,
        longitude: form.longitude || 78.8872
      });
      setSubmitResult(result);
      setForm({
        title: '',
        description: '',
        category: 'Water & Sanitation',
        mandal: 'Bhongiri',
        village: '',
        latitude: null,
        longitude: null,
        image_url: ''
      });
    } catch (err) {
      setFormError(err?.response?.data?.detail || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Pending') return 'text-amber-600 bg-amber-50 border-amber-200';
    if (status === 'Under Review') return 'text-blue-600 bg-blue-50 border-blue-200';
    if (status === 'Action Initiated') return 'text-indigo-600 bg-indigo-50 border-indigo-200';
    if (status === 'Resolved') return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    return 'text-slate-600 bg-slate-50 border-slate-200';
  };

  return (
    <div className="min-h-screen fimms-background">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Citizen Sub Nav */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center space-x-1 py-1">
          {[
            { id: 'map', label: 'District Problem Map', icon: MapPin },
            { id: 'lodge', label: 'Lodge Grievance', icon: Plus },
            { id: 'my_complaints', label: 'My Complaints', icon: FileText }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center space-x-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                activeTab === id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* MAP TAB */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            <div className="fimms-card p-4 flex items-start space-x-3 bg-blue-50/60 border-blue-200">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-blue-900">
                  Live District Problem Intelligence Map
                </p>
                <p className="text-xs text-blue-700 leading-relaxed mt-0.5">
                  View all geo-tagged civic issues across Madurai district. Issues are identified by AI (Gemini RAG) from news wire feeds and your fellow citizens' grievances.
                  🔴 Critical  🟡 Non-critical  🟢 Resolved
                </p>
              </div>
            </div>
            <DistrictMap />
          </div>
        )}

        {/* LODGE GRIEVANCE TAB */}
        {activeTab === 'lodge' && (
          <div className="max-w-2xl mx-auto">

            {submitResult ? (
              // Success state
              <div className="fimms-card p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Grievance Registered!</h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                    Your complaint has been received and processed by the FIMMS AI system.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-2 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">AI Verdict:</span>
                    <span className={`font-bold px-2 py-0.5 rounded-md ${submitResult.is_unique_task ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                      {submitResult.is_unique_task ? '★ Unique Task — New Issue Created' : '🔗 Merged with Existing Cluster'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">Complaint ID:</span>
                    <span className="font-bold text-slate-900">#{submitResult.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">Status:</span>
                    <span className="font-bold text-amber-700">{submitResult.status}</span>
                  </div>
                  {submitResult.matched_issue_id && (
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-500">Linked Issue:</span>
                      <span className="font-bold text-blue-700">District Issue #{submitResult.matched_issue_id}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSubmitResult(null)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors"
                >
                  Lodge Another Complaint
                </button>
              </div>
            ) : (
              // Form
              <div className="fimms-card p-6 space-y-5">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Lodge a Civic Grievance</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Your complaint will be analyzed by AI and deduplicated before being registered as a unique collector task.
                  </p>
                </div>

                {formError && (
                  <div className="flex items-center space-x-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-xs font-semibold text-rose-700">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitComplaint} className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Issue Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Drainage blockage causing flooding near market"
                      value={form.title}
                      onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Detailed Description <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Describe the problem in detail — include duration, affected residents, and urgency..."
                      value={form.description}
                      onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {/* Category + Mandal */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Category</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Mandal</label>
                      <select
                        value={form.mandal}
                        onChange={(e) => setForm(p => ({ ...p, mandal: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {MANDALS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Village */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Village / Area (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Narayanapur colony, near bus stand"
                      value={form.village}
                      onChange={(e) => setForm(p => ({ ...p, village: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* GPS Detection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      GPS Location (Optional — auto-detect or leave blank)
                    </label>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={handleGeoDetect}
                        disabled={geoLoading}
                        className="flex items-center space-x-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-colors"
                      >
                        {geoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                        <span>Detect My Location</span>
                      </button>
                      {form.latitude && form.longitude && (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                          ✓ {form.latitude}, {form.longitude}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Image URL */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Photo / Evidence URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://... (upload to any image host)"
                      value={form.image_url}
                      onChange={(e) => setForm(p => ({ ...p, image_url: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* AI Note */}
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-700 font-medium">
                    🤖 <strong>AI Deduplication:</strong> This complaint will be analyzed by Gemini RAG against all existing district issues. If it is a new unique problem, a Collector Task will be automatically created and mapped on the district dashboard.
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl flex items-center justify-center space-x-2 transition-all shadow-md"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /><span>AI Analyzing...</span></>
                    ) : (
                      <><Send className="w-4 h-4" /><span>Submit Grievance</span></>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* MY COMPLAINTS TAB */}
        {activeTab === 'my_complaints' && (
          <div className="space-y-4">
            {loadingComplaints ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : myComplaints.length === 0 ? (
              <div className="fimms-card py-16 text-center space-y-3">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-500">No complaints filed yet.</p>
                <button
                  onClick={() => setActiveTab('lodge')}
                  className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl"
                >
                  <Plus className="w-4 h-4" />
                  <span>Lodge Your First Complaint</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myComplaints.map((c) => (
                  <div key={c.id} className="fimms-card p-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700">
                          {c.category}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-500 font-medium">{c.mandal}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{c.title}</h4>
                      <p className="text-xs text-slate-600 line-clamp-2">{c.description}</p>
                      <div className="flex items-center space-x-3 text-[10px] font-semibold text-slate-400">
                        <span>Complaint #{c.id}</span>
                        <span>{new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        {c.is_unique_task ? (
                          <span className="text-emerald-600">★ Unique Task</span>
                        ) : (
                          <span className="text-blue-600">🔗 Merged #{c.matched_issue_id}</span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <span className={`inline-flex items-center space-x-1 text-xs font-bold px-3 py-1.5 rounded-full border ${getStatusColor(c.status)}`}>
                        {c.status === 'Resolved' && <CheckCircle2 className="w-3 h-3" />}
                        {c.status === 'Pending' && <Clock className="w-3 h-3" />}
                        <span>{c.status}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
