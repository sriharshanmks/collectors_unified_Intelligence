import React, { useState, useEffect } from 'react';
import { 
  Search, 
  RotateCcw, 
  Plus, 
  MoreVertical, 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  Building2, 
  ArrowRight,
  CheckCircle2,
  X,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';

export default function EntitiesPage() {
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);

  // Form state for new entity
  const [newEntity, setNewEntity] = useState({
    name: '',
    category: 'Hostels',
    status: 'ongoing',
    total_sites: 5,
    scheduled: 1,
    banner_color: 'purple',
    image_url: ''
  });

  const fetchEntities = async () => {
    try {
      setLoading(true);
      const data = await api.collector.getEntities({
        search: searchTerm || undefined,
        status_filter: statusFilter !== 'all' ? statusFilter : undefined
      });
      setEntities(data);
    } catch (err) {
      console.error('Error fetching entities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntities();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEntities();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    fetchEntities();
  };

  const handleCreateEntity = async (e) => {
    e.preventDefault();
    if (!newEntity.name.trim()) return;
    try {
      await api.collector.createEntity({
        ...newEntity,
        issues_count: 0,
        survey_progress: 0,
        completed_count: 0,
        missed_count: 0,
        pending_count: 0
      });
      setIsNewModalOpen(false);
      setNewEntity({
        name: '',
        category: 'Hostels',
        status: 'ongoing',
        total_sites: 5,
        scheduled: 1,
        banner_color: 'purple',
        image_url: ''
      });
      fetchEntities();
    } catch (err) {
      console.error('Failed to create entity:', err);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'ongoing':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            <span>ONGOING</span>
          </span>
        );
      case 'not_initiated':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
            <span>NOT INITIATED</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            <span>COMPLETED</span>
          </span>
        );
      default:
        return null;
    }
  };

  // Counts for pills
  const totalCount = entities.length;
  const ongoingCount = entities.filter(e => e.status === 'ongoing').length;
  const notInitiatedCount = entities.filter(e => e.status === 'not_initiated').length;
  const completedCount = entities.filter(e => e.status === 'completed').length;

  return (
    <div className="min-h-screen fimms-background pb-16 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Top Control Bar (Search, Status Filter Pills, Reset, New Entity Button) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left: Search input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search entities by name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white rounded-full border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-2xs"
            />
          </form>

          {/* Center: Filter Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              All <span className="ml-1 opacity-80">{totalCount || 4}</span>
            </button>

            <button
              onClick={() => setStatusFilter('ongoing')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'ongoing'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Ongoing <span className="ml-1 opacity-80">{ongoingCount || 3}</span>
            </button>

            <button
              onClick={() => setStatusFilter('not_initiated')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'not_initiated'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Not initiated <span className="ml-1 opacity-80">{notInitiatedCount || 1}</span>
            </button>

            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === 'completed'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              Completed <span className="ml-1 opacity-80">{completedCount || 0}</span>
            </button>
          </div>

          {/* Right: Reset & New Entity Buttons */}
          <div className="flex items-center space-x-3 self-end lg:self-center">
            <button
              onClick={handleResetFilters}
              className="flex items-center space-x-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset filters</span>
            </button>

            <button
              onClick={() => setIsNewModalOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-full shadow-sm hover:shadow transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Entity</span>
            </button>
          </div>

        </div>

        {/* Subtitle / Counter Row */}
        <div className="text-xs font-bold tracking-wider uppercase text-slate-500">
          TOTAL ENTITIES: <span className="text-slate-900 font-extrabold">{totalCount || 4}</span>
          <span className="mx-2 text-slate-300">|</span>
          SURVEY NOT INITIATED YET: <span className="text-slate-900 font-extrabold">{notInitiatedCount || 1}</span>
        </div>

        {/* Entity Cards Grid (Matches Screenshot 1) */}
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {entities.map((entity) => (
              <div 
                key={entity.id} 
                className="fimms-card overflow-hidden flex flex-col justify-between group hover:border-blue-300 transition-all"
              >
                <div>
                  
                  {/* Top Image or Icon Banner */}
                  <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                    {entity.image_url ? (
                      <img 
                        src={entity.image_url} 
                        alt={entity.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-purple-100 via-indigo-50 to-blue-50 flex items-center justify-start p-6">
                        <div className="w-14 h-14 rounded-2xl bg-white/90 shadow-md flex items-center justify-center text-purple-600">
                          <Building2 className="w-8 h-8" />
                        </div>
                      </div>
                    )}
                    
                    {/* Top Right 3 dots */}
                    <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-xs flex items-center justify-center text-slate-700 hover:bg-white shadow-xs">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-4">
                    
                    {/* Title & Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {entity.name}
                      </h3>
                      <div className="shrink-0">
                        {getStatusBadge(entity.status)}
                      </div>
                    </div>

                    {/* Survey Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-500 font-medium">
                        <span>Survey progress</span>
                        <span className="font-bold text-slate-900">{entity.survey_progress || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${entity.survey_progress || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Status Dots (0 completed, 0 missed, 0 pending) */}
                    <div className="flex items-center space-x-4 text-xs font-semibold text-slate-600 pt-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>{entity.completed_count || 0} completed</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        <span>{entity.missed_count || 0} missed</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                        <span>{entity.pending_count || 0} pending</span>
                      </div>
                    </div>

                    {/* Stat Pills Row (Total sites, Scheduled, Issues) */}
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center space-x-2">
                        <div className="text-blue-600 shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-slate-900 leading-none">
                            {entity.total_sites || 1}
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">Total sites</p>
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center space-x-2">
                        <div className="text-blue-600 shrink-0">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-slate-900 leading-none">
                            {entity.scheduled || 0}
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">Scheduled</p>
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center space-x-2">
                        <div className="text-amber-500 shrink-0">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-slate-900 leading-none">
                            {entity.issues_count || 0}
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">Issues</p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Card Footer Button */}
                <div className="p-5 pt-0">
                  <button
                    onClick={() => setSelectedEntity(entity)}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-blue-700 bg-blue-50/80 hover:bg-blue-100 border border-blue-100 flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <span>View entity</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      {/* New Entity Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <span>Create New Monitoring Entity</span>
              </h3>
              <button 
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEntity} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Entity Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PRIMARY HEALTH CENTRES (PHCs)"
                  value={newEntity.name}
                  onChange={(e) => setNewEntity({ ...newEntity, name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newEntity.category}
                    onChange={(e) => setNewEntity({ ...newEntity, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="Hostels">Hostels</option>
                    <option value="Health">Health & Hospitals</option>
                    <option value="Water">Water & Irrigation</option>
                    <option value="Roads">PWD & Roads</option>
                    <option value="Schools">Schools & Anganwadi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Status</label>
                  <select
                    value={newEntity.status}
                    onChange={(e) => setNewEntity({ ...newEntity, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="ongoing">Ongoing</option>
                    <option value="not_initiated">Not Initiated</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Sites</label>
                  <input
                    type="number"
                    min="1"
                    value={newEntity.total_sites}
                    onChange={(e) => setNewEntity({ ...newEntity, total_sites: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Banner Image URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newEntity.image_url}
                    onChange={(e) => setNewEntity({ ...newEntity, image_url: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
                >
                  Save Entity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Entity Details Drawer/Modal */}
      {selectedEntity && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedEntity.name}</h3>
                <p className="text-xs text-slate-500">Category: {selectedEntity.category} • District-wide monitoring</p>
              </div>
              <button 
                onClick={() => setSelectedEntity(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="font-semibold text-slate-500">Monitoring Status:</span>
                <span>{getStatusBadge(selectedEntity.status)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="font-semibold text-slate-500">Total Registered Facilities:</span>
                <span className="font-bold text-slate-900">{selectedEntity.total_sites} Sites</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="font-semibold text-slate-500">Active Collector Issues:</span>
                <span className="font-bold text-rose-600">{selectedEntity.issues_count} Open</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="font-semibold text-slate-500">Inspection Schedule:</span>
                <span className="font-semibold text-blue-700">Cycle 6 (15-day inspection)</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedEntity(null)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
