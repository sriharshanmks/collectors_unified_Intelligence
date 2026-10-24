import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import MapComponent from '../components/MapComponent';
import EdaCharts from '../components/EdaCharts';
import RagChat from '../components/RagChat';
import NewsFeed from '../components/NewsFeed';
import {
  MapPin,
  BarChart2,
  Sparkles,
  Newspaper,
  ListFilter,
  RefreshCw,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Send,
  SlidersHorizontal,
  Layers,
} from 'lucide-react';

export const CollectorDashboard = () => {
  const [activeTab, setActiveTab] = useState('map'); // 'map', 'eda', 'rag', 'news', 'table'
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, complaintsData] = await Promise.all([
        api.collector.getStats('Coimbatore'),
        api.collector.getComplaints(),
      ]);
      setStats(statsData);
      setComplaints(complaintsData);
    } catch (err) {
      console.error('Failed to load collector data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleStatusUpdate = async (id, updateData) => {
    try {
      await api.collector.updateStatus(id, updateData);
      // Refresh complaints and stats
      loadDashboardData();
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status. Please try again.');
    }
  };

  const filteredTableComplaints = complaints.filter((c) => {
    const matchPri = filterPriority === 'All' || c.priority === filterPriority;
    const matchStat = filterStatus === 'All' || c.status === filterStatus;
    return matchPri && matchStat;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* District Collector Header Command Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-5 rounded-2xl border border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <h1 className="text-xl font-black text-white tracking-tight">
                District Grievance & Strategic Command Center
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Real-time geospatial hotspot triage, exploratory analytics, and Amazon Bedrock RAG advisory.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadDashboardData}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Refresh Telemetry</span>
            </button>

            <button
              onClick={() => setActiveTab('rag')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Consult Bedrock RAG</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('map')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'map'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>🗺️ Geospatial Problem Map</span>
          </button>

          <button
            onClick={() => setActiveTab('eda')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'eda'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>📊 EDA Analytics & Charts</span>
          </button>

          <button
            onClick={() => setActiveTab('rag')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'rag'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>🧠 Amazon Bedrock RAG</span>
          </button>

          <button
            onClick={() => setActiveTab('news')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'news'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Newspaper className="w-4 h-4" />
            <span>📰 Live News Wire</span>
          </button>

          <button
            onClick={() => setActiveTab('table')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'table'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <ListFilter className="w-4 h-4" />
            <span>📋 Grievance Action Table ({complaints.length})</span>
          </button>
        </div>

        {/* Tab Content Display */}
        {loading && !stats ? (
          <div className="p-16 text-center text-slate-400">Loading district intelligence...</div>
        ) : (
          <div>
            {/* TAB 1: GEOSPATIAL PROBLEM MAP */}
            {activeTab === 'map' && (
              <div className="space-y-4">
                <div className="h-[600px] w-full">
                  <MapComponent
                    complaints={complaints}
                    isCollector={true}
                    onStatusUpdate={handleStatusUpdate}
                  />
                </div>
              </div>
            )}

            {/* TAB 2: EDA CHARTS */}
            {activeTab === 'eda' && (
              <div className="space-y-6">
                <EdaCharts stats={stats} />
              </div>
            )}

            {/* TAB 3: BEDROCK RAG INTELLIGENCE */}
            {activeTab === 'rag' && (
              <div className="space-y-6">
                <RagChat district="Coimbatore" />
              </div>
            )}

            {/* TAB 4: LIVE NEWS WIRE */}
            {activeTab === 'news' && (
              <div className="space-y-6">
                <NewsFeed />
              </div>
            )}

            {/* TAB 5: GRIEVANCES ACTION REGISTER TABLE */}
            {activeTab === 'table' && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-300">Filter By Priority:</span>
                    <select
                      value={filterPriority}
                      onChange={(e) => setFilterPriority(e.target.value)}
                      className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1"
                    >
                      <option value="All">All Priorities</option>
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>

                    <span className="font-semibold text-slate-300 ml-2">Status:</span>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Action Initiated">Action Initiated</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>

                  <span className="text-slate-400 font-mono">
                    Showing {filteredTableComplaints.length} of {complaints.length} records
                  </span>
                </div>

                {/* Table */}
                <div className="glass-panel rounded-2xl border border-slate-800 overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[11px]">
                      <tr>
                        <th className="px-4 py-3">ID / Priority</th>
                        <th className="px-4 py-3">Category & Title</th>
                        <th className="px-4 py-3">Taluk / Location</th>
                        <th className="px-4 py-3">Bedrock AI Insights</th>
                        <th className="px-4 py-3">Status & Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredTableComplaints.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="px-4 py-3 font-mono">
                            <div className="font-bold text-white">#{c.id}</div>
                            <span
                              className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                                c.priority === 'Critical'
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  : c.priority === 'High'
                                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {c.priority} ({c.priority_score})
                            </span>
                          </td>

                          <td className="px-4 py-3 max-w-xs">
                            <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                              {c.category}
                            </span>
                            <div className="font-bold text-white leading-snug mt-0.5">{c.title}</div>
                            <div className="text-slate-400 text-[11px] line-clamp-2 mt-1">
                              {c.description}
                            </div>
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-medium text-white">{c.taluk || 'Coimbatore'}</div>
                            <div className="text-[11px] text-slate-400">{c.village || c.address || 'Rural Belt'}</div>
                          </td>

                          <td className="px-4 py-3 max-w-sm text-[11px]">
                            {c.ai_summary ? (
                              <div className="space-y-1">
                                <div className="text-emerald-300 font-medium">{c.ai_summary}</div>
                                {c.ai_suggested_action && (
                                  <div className="text-amber-300/90 italic">
                                    Action: {c.ai_suggested_action}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">No summary logged</span>
                            )}
                          </td>

                          <td className="px-4 py-3 whitespace-nowrap">
                            <select
                              value={c.status}
                              onChange={(e) => handleStatusUpdate(c.id, { status: e.target.value })}
                              className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Under Review">Under Review</option>
                              <option value="Action Initiated">Action Initiated</option>
                              <option value="Resolved">Resolved</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
};

export default CollectorDashboard;
