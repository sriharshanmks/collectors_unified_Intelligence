import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertTriangle, CheckCircle2, Clock, Filter, Sparkles, Newspaper, User } from 'lucide-react';
import { api } from '../services/api';

// Custom icons using Leaflet DivIcon
const createCustomMarker = (severity, status) => {
  let color = '#3b82f6';
  let isPulse = false;

  if (severity === 'Critical') {
    color = '#ef4444';
    isPulse = true;
  } else if (severity === 'High') {
    color = '#f97316';
  } else if (severity === 'Medium') {
    color = '#eab308';
  } else {
    color = '#10b981';
  }

  if (status === 'Resolved') {
    color = '#10b981';
    isPulse = false;
  }

  return L.divIcon({
    className: 'custom-pin',
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        ${isPulse ? `<span style="position: absolute; width: 32px; height: 32px; border-radius: 9999px; background-color: ${color}; opacity: 0.4; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>` : ''}
        <div style="width: 20px; height: 20px; border-radius: 9999px; background-color: ${color}; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; z-index: 10;">
          <div style="width: 6px; height: 6px; border-radius: 9999px; background-color: white;"></div>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

// Map recentering controller
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

export default function DistrictMap({ onIssueUpdated }) {
  const [mapData, setMapData] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [filterMandal, setFilterMandal] = useState('All');
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMapData = async () => {
    try {
      setLoading(true);
      const data = await api.collector.getMapData();
      setMapData(data);
    } catch (err) {
      console.error('Failed to load district map data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, []);

  const handleUpdateStatus = async (issueId, newStatus) => {
    try {
      await api.collector.updateIssue(issueId, { status: newStatus });
      fetchMapData();
      if (onIssueUpdated) onIssueUpdated();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const center = [9.9252, 78.1198]; // Madurai district center (Tamil Nadu)

  const issues = mapData?.issues || [];
  const mandals = mapData?.mandals || [];

  const filteredIssues = issues.filter((iss) => {
    const matchSev = filterSeverity === 'All' || iss.severity === filterSeverity;
    const matchMandal = filterMandal === 'All' || iss.mandal === filterMandal;
    return matchSev && matchMandal;
  });

  return (
    <div className="fimms-card p-4 space-y-4">
      {/* Map Header & Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <span>District Problem Hotspot Map (Madurai District)</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
              {filteredIssues.length} Geotagged Issues
            </span>
          </h3>
          <p className="text-xs text-slate-500">
            Real-time geospatial intelligence mapped from News API deduplication & citizen grievance registers.
          </p>
        </div>

        {/* Severity & Mandal Filters */}
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-full text-xs font-semibold">
            {['All', 'Critical', 'Non-critical'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-3 py-1 rounded-full transition-all ${
                  filterSeverity === sev
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <select
            value={filterMandal}
            onChange={(e) => setFilterMandal(e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-blue-500 shadow-2xs"
          >
            <option value="All">All 19 Mandals</option>
            {mandals.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Interactive Leaflet Map Container */}
      <div className="relative h-[480px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
        <MapContainer
          center={center}
          zoom={10}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <RecenterMap center={center} />
          
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Mandal boundary circles */}
          {mandals.map((m) => (
            <CircleMarker
              key={`mandal-${m.id}`}
              center={[m.lat, m.lng]}
              radius={18}
              pathOptions={{
                color: '#3b82f6',
                fillColor: '#93c5fd',
                fillOpacity: 0.15,
                weight: 1.5,
                dashArray: '4, 4'
              }}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <p className="font-bold text-slate-900">{m.name} Mandal</p>
                  <p className="text-slate-500">Health Index: {m.health_score}/100</p>
                  <p className="text-slate-500">Open Issues: {m.open_issues}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Issue Pins */}
          {filteredIssues.map((iss) => (
            <Marker
              key={`issue-${iss.id}`}
              position={[iss.lat, iss.lng]}
              icon={createCustomMarker(iss.severity, iss.status)}
            >
              <Popup>
                <div className="p-2 space-y-2 max-w-xs text-xs font-sans">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      iss.severity === 'Critical' 
                        ? 'bg-rose-100 text-rose-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {iss.severity}
                    </span>
                    <span className="text-slate-500 font-medium">#{iss.id}</span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm leading-snug">
                    {iss.title}
                  </h4>

                  <p className="text-slate-600 line-clamp-3 leading-relaxed">
                    {iss.description}
                  </p>

                  <div className="bg-slate-50 p-2 rounded-lg space-y-1 text-[11px] text-slate-600">
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-500">Mandal:</span>
                      <span className="font-bold text-slate-800">{iss.mandal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-500">Department:</span>
                      <span className="font-bold text-slate-800">{iss.department}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-500">AI Deduplication:</span>
                      <span className="inline-flex items-center text-emerald-700 font-bold">
                        <Sparkles className="w-3 h-3 mr-1 text-emerald-600" />
                        {Math.round((iss.ai_confidence || 0.95) * 100)}% unique
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-500">Evidence Cluster:</span>
                      <span className="font-bold text-blue-600">{iss.cluster_count} reports merged</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-500">Status: <strong className="text-slate-900">{iss.status}</strong></span>
                    {iss.status !== 'Resolved' ? (
                      <button
                        onClick={() => handleUpdateStatus(iss.id, 'Resolved')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] transition-colors"
                      >
                        Mark Resolved
                      </button>
                    ) : (
                      <span className="text-emerald-600 font-bold text-[10px] flex items-center">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Resolved
                      </span>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Floating Legend */}
        <div className="absolute bottom-4 right-4 z-40 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200 shadow-md text-xs space-y-1">
          <p className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">Severity Legend</p>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="text-slate-600">Critical Priority</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-slate-600">Non-critical / Medium</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-600">Resolved / Low</span>
          </div>
        </div>
      </div>
    </div>
  );
}
