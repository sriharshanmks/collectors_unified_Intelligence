import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { AlertCircle, AlertTriangle, CheckCircle2, Clock, Filter, Navigation, ShieldAlert, Sparkles } from 'lucide-react';

// Custom Map Marker Icons using HTML/SVG DivIcon
const createCustomIcon = (priority) => {
  let color = '#10b981'; // Green
  let ping = false;

  if (priority === 'Critical') {
    color = '#ef4444'; // Red
    ping = true;
  } else if (priority === 'High') {
    color = '#f97316'; // Orange
  } else if (priority === 'Medium') {
    color = '#eab308'; // Yellow
  }

  const html = `
    <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
      ${ping ? `<span style="position: absolute; width: 32px; height: 32px; border-radius: 9999px; background-color: ${color}; opacity: 0.75; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>` : ''}
      <div style="position: relative; width: 20px; height: 20px; border-radius: 9999px; background-color: ${color}; border: 3px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.4);"></div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: html,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

// Click handler for picking locations
function LocationPickerHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export const MapComponent = ({
  complaints = [],
  isCollector = false,
  onStatusUpdate = null,
  onLocationSelect = null,
  selectedLocation = null,
  center = [11.0168, 76.9558], // Default: Coimbatore coordinates
  zoom = 11,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');

  // Filter complaints
  const filteredComplaints = complaints.filter((c) => {
    const matchCat = selectedCategory === 'All' || c.category === selectedCategory;
    const matchPri = selectedPriority === 'All' || c.priority === selectedPriority;
    return matchCat && matchPri;
  });

  const categories = [
    'All',
    'Water Scarcity',
    'Crop Disease & Pest',
    'Fertilizer & Seed',
    'Power & Irrigation',
    'Roads & Transport',
    'Disaster / Flood / Drought',
    'Market Pricing & MSP',
  ];

  const priorities = ['All', 'Critical', 'High', 'Medium', 'Low'];

  return (
    <div className="relative w-full h-full flex flex-col rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl">
      {/* Map Control / Filter Header Bar */}
      <div className="p-3.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Interactive Problem Map ({filteredComplaints.length} Hotspots)
          </span>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-400 font-medium">Priority:</span>
          {priorities.map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPriority(p)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${
                selectedPriority === p
                  ? p === 'Critical'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                    : p === 'High'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-medium">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative flex-1 w-full min-h-[420px]">
        <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {onLocationSelect && <LocationPickerHandler onLocationSelect={onLocationSelect} />}

          {/* Selected marker when user clicks to drop a pin */}
          {selectedLocation && (
            <Marker
              position={[selectedLocation.lat, selectedLocation.lng]}
              icon={createCustomIcon('Critical')}
            >
              <Popup>
                <div className="text-xs p-1">
                  <strong>Selected Grievance Location:</strong>
                  <br />
                  Lat: {selectedLocation.lat.toFixed(4)}, Lng: {selectedLocation.lng.toFixed(4)}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Render All Complaint Hotspots */}
          {filteredComplaints.map((c) => (
            <Marker
              key={c.id}
              position={[c.latitude, c.longitude]}
              icon={createCustomIcon(c.priority)}
            >
              <Popup className="farmai-popup">
                <div className="p-1 space-y-2 max-w-xs text-slate-100">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.priority === 'Critical'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : c.priority === 'High'
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {c.priority} Priority (Score: {c.priority_score})
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">#{c.id}</span>
                  </div>

                  <h4 className="font-bold text-sm text-white leading-snug">{c.title}</h4>

                  <p className="text-xs text-slate-300 line-clamp-3">{c.description}</p>

                  <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700/60 text-[11px] space-y-1">
                    <div className="text-slate-400">
                      <strong>Location:</strong> {c.taluk || 'Coimbatore'} {c.village ? `(${c.village})` : ''}
                    </div>
                    <div className="text-slate-400">
                      <strong>Category:</strong> {c.category}
                    </div>
                    <div className="text-slate-400">
                      <strong>Status:</strong>{' '}
                      <span className="text-emerald-400 font-semibold">{c.status}</span>
                    </div>
                  </div>

                  {/* Bedrock AI Intelligence Insight */}
                  {c.ai_summary && (
                    <div className="bg-emerald-950/40 border border-emerald-800/50 p-2 rounded-lg text-[11px] text-emerald-200">
                      <div className="flex items-center gap-1 font-bold text-emerald-300 mb-0.5">
                        <Sparkles className="w-3 h-3 text-emerald-400" /> Bedrock AI Assessment:
                      </div>
                      <p className="italic text-emerald-200/90">{c.ai_summary}</p>
                    </div>
                  )}

                  {/* Collector Status Update Control */}
                  {isCollector && onStatusUpdate && (
                    <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-medium text-slate-400">Change Status:</span>
                      <select
                        defaultValue={c.status}
                        onChange={(e) => onStatusUpdate(c.id, { status: e.target.value })}
                        className="text-xs bg-slate-800 border border-slate-600 rounded px-2 py-0.5 text-white focus:outline-none"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Under Review">Under Review</option>
                        <option value="Action Initiated">Action Initiated</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Floating Legend */}
        <div className="absolute bottom-3 left-3 z-30 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 text-[11px] shadow-lg flex items-center gap-3">
          <span className="font-semibold text-slate-300">Priority Legend:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block animate-ping"></span>
            <span className="text-red-400">Critical</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
            <span className="text-orange-400">High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block"></span>
            <span className="text-yellow-400">Medium</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span className="text-emerald-400">Low</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;
