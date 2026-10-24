import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  FileText, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Search, 
  ChevronDown, 
  Columns, 
  Maximize2, 
  MapPin, 
  Sparkles,
  AlertOctagon,
  TrendingDown,
  Layers,
  Filter
} from 'lucide-react';
import { api } from '../services/api';
import DistrictMap from '../components/DistrictMap';
import AiTriageDrawer from '../components/AiTriageDrawer';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('dashboard'); // 'dashboard', 'map', 'issues', 'coverage', 'ai_triage'
  
  // Filters
  const [selectedMandal, setSelectedMandal] = useState('All');
  const [selectedEntity, setSelectedEntity] = useState('All');
  const [breakdownTab, setBreakdownTab] = useState('department'); // 'department', 'taluka', 'hod', 'site'
  const [mandalSearch, setMandalSearch] = useState('');
  const [showAllMandals, setShowAllMandals] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await api.collector.getDashboardStats({
        mandal: selectedMandal !== 'All' ? selectedMandal : undefined,
        entity: selectedEntity !== 'All' ? selectedEntity : undefined
      });
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedMandal, selectedEntity]);

  const mandalsList = stats?.mandals || [];
  const filteredMandals = mandalsList.filter(m => 
    m.name.toLowerCase().includes(mandalSearch.toLowerCase())
  );
  const displayedMandals = showAllMandals ? filteredMandals : filteredMandals.slice(0, 7);

  // Helper for health dot color
  const getHealthColor = (score) => {
    if (score < 25) return 'text-rose-600 bg-rose-600';
    if (score < 50) return 'text-amber-500 bg-amber-500';
    return 'text-emerald-500 bg-emerald-500';
  };

  return (
    <div className="min-h-screen fimms-background pb-16 pt-5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Sub-Navigation & Right Controls (From Screenshot 2) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
          
          {/* Subnav Pills */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveSubTab('dashboard')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeSubTab === 'dashboard'
                  ? 'bg-white text-slate-900 border border-slate-200 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${activeSubTab === 'dashboard' ? 'bg-blue-600' : 'bg-transparent'}`} />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveSubTab('map')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeSubTab === 'map'
                  ? 'bg-white text-slate-900 border border-slate-200 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>District Map</span>
            </button>

            <button
              onClick={() => setActiveSubTab('ai_triage')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeSubTab === 'ai_triage'
                  ? 'bg-white text-slate-900 border border-slate-200 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>AI Triage & RAG</span>
            </button>

            <button
              onClick={() => setActiveSubTab('issues')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeSubTab === 'issues'
                  ? 'bg-white text-slate-900 border border-slate-200 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Issues
            </button>

            <button
              onClick={() => setActiveSubTab('coverage')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeSubTab === 'coverage'
                  ? 'bg-white text-slate-900 border border-slate-200 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Coverage
            </button>
          </div>

          {/* Right Toolbar: Last 30 days, Split, Full */}
          <div className="flex items-center space-x-2 self-end sm:self-center">
            <select className="text-xs font-semibold px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 shadow-2xs focus:outline-hidden">
              <option>Last 30 days</option>
              <option>Last 7 days</option>
              <option>Last 90 days</option>
              <option>Current Survey Cycle</option>
            </select>

            <button className="flex items-center space-x-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 shadow-2xs">
              <Columns className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>

            <button className="flex items-center space-x-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 shadow-2xs">
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Full</span>
            </button>
          </div>

        </div>

        {/* Dropdowns & Subtitle Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <select
              value={selectedMandal}
              onChange={(e) => setSelectedMandal(e.target.value)}
              className="font-bold text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-900 shadow-2xs focus:outline-hidden"
            >
              <option value="All">All Mandals</option>
              {mandalsList.map(m => (
                <option key={m.id} value={m.name}>{m.name}</option>
              ))}
            </select>

            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="font-bold text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-900 shadow-2xs focus:outline-hidden"
            >
              <option value="All">All Entities</option>
              <option value="Government Hostels">Government Hostels</option>
              <option value="Reports Test">Reports Test</option>
              <option value="Uday Test">Uday Test Hostels</option>
            </select>
          </div>

          <p className="text-slate-500 font-medium">
            District-wide • every tile, chart and row is a shortcut into the boards
          </p>
        </div>

        {/* If Map Tab Selected */}
        {activeSubTab === 'map' && (
          <DistrictMap onIssueUpdated={fetchStats} />
        )}

        {/* If AI Triage Selected */}
        {activeSubTab === 'ai_triage' && (
          <AiTriageDrawer onTasksUpdated={fetchStats} />
        )}

        {/* Main Dashboard Content */}
        {activeSubTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* 4 Metric Cards (Matching Screenshot 2) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* 1. TOTAL SITES */}
              <div className="fimms-card p-5 flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Building2 className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    TOTAL SITES
                  </p>
                  <p className="text-2xl font-black text-slate-900 leading-tight">
                    {stats?.total_sites || 99}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    All active sites
                  </p>
                </div>
              </div>

              {/* 2. TOTAL ISSUES */}
              <div className="fimms-card p-5 flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    TOTAL ISSUES
                  </p>
                  <p className="text-2xl font-black text-slate-900 leading-tight">
                    {stats?.total_issues || 0}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    Raised in this period
                  </p>
                </div>
              </div>

              {/* 3. COMPLETED */}
              <div className="fimms-card p-5 flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    COMPLETED
                  </p>
                  <p className="text-2xl font-black text-slate-900 leading-tight">
                    {stats?.completed || 0}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    Completed in this period
                  </p>
                </div>
              </div>

              {/* 4. PENDING */}
              <div className="fimms-card p-5 flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 stroke-[1.8]" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    PENDING
                  </p>
                  <p className="text-2xl font-black text-slate-900 leading-tight">
                    {stats?.pending || 0}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    Still open
                  </p>
                </div>
              </div>

            </div>

            {/* Row 2: Issue Breakdown Card & Issues By Age Card */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left: Issue Breakdown */}
              <div className="fimms-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center">
                    <span>ISSUE BREAKDOWN</span>
                    <ChevronRight className="w-4 h-4 ml-1 text-slate-400" />
                  </h4>
                  <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-full text-[11px] font-semibold">
                    {['Department', 'Taluka', 'HOD', 'Site'].map((tab) => {
                      const tabKey = tab.toLowerCase();
                      const isActive = breakdownTab === tabKey;
                      return (
                        <button
                          key={tab}
                          onClick={() => setBreakdownTab(tabKey)}
                          className={`px-3 py-1 rounded-full transition-all ${
                            isActive
                              ? 'bg-white text-slate-900 shadow-2xs'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {tab}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  {Object.keys(stats?.issues_by_department || {}).length} / 15 departments with issues • {stats?.total_issues || 0} open
                </p>

                {/* Render breakdown items */}
                <div className="space-y-2 pt-2">
                  {breakdownTab === 'department' && (
                    Object.entries(stats?.issues_by_department || {}).length > 0 ? (
                      Object.entries(stats.issues_by_department).map(([dept, count]) => (
                        <div key={dept} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-slate-700">
                            <span>{dept}</span>
                            <span className="font-extrabold text-slate-900">{count} issues</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(100, (count / (stats?.total_issues || 1)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="h-32 flex items-center justify-center text-xs text-slate-400">
                        No open issues in this selection.
                      </div>
                    )
                  )}

                  {breakdownTab === 'taluka' && (
                    Object.entries(stats?.issues_by_taluka || {}).map(([taluka, count]) => (
                      <div key={taluka} className="flex justify-between items-center text-xs py-1 border-b border-slate-50">
                        <span className="font-semibold text-slate-700">{taluka}</span>
                        <span className="font-bold text-slate-900">{count}</span>
                      </div>
                    ))
                  )}

                  {breakdownTab === 'hod' && (
                    Object.entries(stats?.issues_by_hod || {}).map(([hod, count]) => (
                      <div key={hod} className="flex justify-between items-center text-xs py-1 border-b border-slate-50">
                        <span className="font-semibold text-slate-700">{hod}</span>
                        <span className="font-bold text-slate-900">{count}</span>
                      </div>
                    ))
                  )}

                  {breakdownTab === 'site' && (
                    Object.entries(stats?.issues_by_site || {}).map(([site, count]) => (
                      <div key={site} className="flex justify-between items-center text-xs py-1 border-b border-slate-50">
                        <span className="font-semibold text-slate-700">{site}</span>
                        <span className="font-bold text-slate-900">{count}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right: Issues By Age */}
              <div className="fimms-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center">
                    <span>ISSUES BY AGE</span>
                    <ChevronRight className="w-4 h-4 ml-1 text-slate-400" />
                  </h4>
                  <span className="text-xs text-slate-400 font-medium italic">click a band to filter</span>
                </div>

                <div className="space-y-3 pt-4">
                  {Object.entries(stats?.issues_by_age || { "0-7 Days": 2, "8-15 Days": 1, "16-30 Days": 1, "30+ Days": 1 }).map(([band, count]) => (
                    <div key={band} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>{band}</span>
                        <span className="font-extrabold text-slate-900">{count}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-2 rounded-full" 
                          style={{ width: `${Math.min(100, (count / (stats?.total_issues || 5)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Row 3: Issues By Importance & Issues By Type (Donut visual representation) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Importance Donut Card */}
              <div className="fimms-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center">
                    <span>ISSUES BY IMPORTANCE</span>
                    <ChevronRight className="w-4 h-4 ml-1 text-slate-400" />
                  </h4>
                </div>

                <div className="flex items-center justify-center py-6 space-x-8">
                  {/* Visual Ring / Center */}
                  <div className="relative w-32 h-32 rounded-full border-8 border-slate-100 flex items-center justify-center">
                    <div 
                      className="absolute inset-0 rounded-full border-8 border-rose-500 border-t-transparent border-l-transparent" 
                      style={{ transform: 'rotate(45deg)' }}
                    />
                    <div className="text-center">
                      <span className="block text-2xl font-black text-slate-900">
                        {stats?.total_issues || 0}
                      </span>
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        OPEN
                      </span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="space-y-2 text-xs font-medium">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      <span className="text-slate-700 font-semibold">Critical</span>
                      <span className="text-slate-900 font-bold ml-1">
                        {stats?.critical_issues_count || 0}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      <span className="text-slate-700 font-semibold">Non-critical</span>
                      <span className="text-slate-900 font-bold ml-1">
                        {stats?.non_critical_issues_count || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Type Donut Card */}
              <div className="fimms-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center">
                    <span>ISSUES BY TYPE</span>
                    <ChevronRight className="w-4 h-4 ml-1 text-slate-400" />
                  </h4>
                </div>

                <div className="flex items-center justify-center py-6 space-x-8">
                  <div className="relative w-32 h-32 rounded-full border-8 border-slate-100 flex items-center justify-center">
                    <div 
                      className="absolute inset-0 rounded-full border-8 border-blue-500 border-t-transparent" 
                      style={{ transform: 'rotate(90deg)' }}
                    />
                    <div className="text-center">
                      <span className="block text-2xl font-black text-slate-900">
                        {stats?.total_issues || 0}
                      </span>
                      <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        OPEN
                      </span>
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="space-y-1.5 text-xs font-medium">
                    {Object.entries(stats?.issues_by_type || { Hostels: 3, Water: 1, Health: 1 }).map(([type, count]) => (
                      <div key={type} className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        <span className="text-slate-700 font-semibold">{type}</span>
                        <span className="text-slate-900 font-bold ml-1">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Row 4: DISTRICT SCORECARD (Exact table from Screenshot 2) */}
            <div className="fimms-card p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    DISTRICT SCORECARD
                  </h4>
                  <p className="text-xs text-slate-400 italic">
                    click a header to sort - a row to scope
                  </p>
                </div>

                {/* Filter mandals input */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter mandals..."
                    value={mandalSearch}
                    onChange={(e) => setMandalSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">MANDAL</th>
                      <th className="py-2.5 px-3">HEALTH</th>
                      <th className="py-2.5 px-3">COVERAGE</th>
                      <th className="py-2.5 px-3 text-right">OPEN</th>
                      <th className="py-2.5 px-3 text-right">CRIT</th>
                      <th className="py-2.5 px-3 text-right">OVERDUE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedMandals.map((m) => (
                      <tr 
                        key={m.id} 
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                        onClick={() => setSelectedMandal(m.name)}
                      >
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {m.name}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center space-x-1.5 font-bold">
                            <span className={`w-2 h-2 rounded-full ${m.health_score < 25 ? 'bg-rose-600' : 'bg-emerald-500'}`} />
                            <span className={m.health_score < 25 ? 'text-rose-600' : 'text-slate-800'}>
                              {m.health_score}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-slate-400 h-1.5 rounded-full" 
                              style={{ width: `${m.coverage_pct || 15}%` }} 
                            />
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900">
                          {m.open_issues}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-rose-600">
                          {m.critical_issues}
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-slate-500">
                          {m.overdue_issues}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Show All Mandals Button */}
              <div className="text-center pt-2">
                <button
                  onClick={() => setShowAllMandals(!showAllMandals)}
                  className="inline-flex items-center space-x-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${showAllMandals ? 'rotate-180' : ''}`} />
                  <span>{showAllMandals ? 'Show top 7 mandals' : 'Show all 19 mandals'}</span>
                </button>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
