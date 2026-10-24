import React, { useState, useEffect } from 'react';
import {
  Download,
  ChevronRight,
  Loader2,
  Calendar,
  Building2,
  AlertTriangle,
  CheckCircle2,
  X,
  FileText
} from 'lucide-react';
import { api } from '../services/api';

// Format date nicely: "30 Aug 2026"
function fmtDate(d) {
  if (!d) return '─';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('All entities');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);

  const today = new Date().toISOString().slice(0, 10);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await api.collector.getReports({
        entity_name: entityFilter !== 'All entities' ? entityFilter : undefined
      });
      setReports(data);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [entityFilter]);

  // Split into two columns matching Screenshot 4
  const leftCol = reports.filter((_, i) => i % 2 === 0);
  const rightCol = reports.filter((_, i) => i % 2 !== 0);

  return (
    <div className="min-h-screen fimms-background pb-16 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Reports</h2>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              Preview and download a report for any completed or ongoing survey.
            </p>
          </div>
          <button className="self-start flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm">
            <FileText className="w-4 h-4 text-slate-500" />
            <span>Collector checklist →</span>
          </button>
        </div>

        {/* Section title + Filter Row */}
        <div className="fimms-card p-5 space-y-4">
          <h3 className="text-base font-bold text-slate-900">Survey reports</h3>
          <p className="text-xs text-slate-500">
            Pick a survey to preview and download its report — ongoing cycles included.
          </p>

          {/* Entity Selector + Date Range */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1 space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Entity</label>
              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>All entities</option>
                <option>GOVERNMENT HOSTELS</option>
                <option>REPORTS TEST — GOVT HOSTELS</option>
                <option>UDAY TEST HOSTELS</option>
                <option>FIMMS TEST</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">To</label>
              <input
                type="date"
                value={toDate || today}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Reports Two-Column Grid (Screenshot 4 layout) */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <div className="divide-y divide-slate-100">
              {leftCol.map((report) => (
                <ReportRow
                  key={report.id}
                  report={report}
                  onClick={() => setSelectedReport(report)}
                />
              ))}
            </div>
            <div className="divide-y divide-slate-100 border-l border-slate-100">
              {rightCol.map((report) => (
                <ReportRow
                  key={report.id}
                  report={report}
                  onClick={() => setSelectedReport(report)}
                />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-200">
                    {selectedReport.entity_name}
                  </p>
                  <h3 className="text-base font-black leading-snug">
                    {selectedReport.title}
                  </h3>
                  <p className="text-xs text-blue-200">
                    {selectedReport.cycle_label}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-blue-200 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-black text-emerald-700">
                    {selectedReport.completed_count}
                  </p>
                  <p className="text-[10px] font-bold text-emerald-600 mt-0.5">completed</p>
                </div>
                <div className="bg-rose-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-black text-rose-700">
                    {selectedReport.missed_count}
                  </p>
                  <p className="text-[10px] font-bold text-rose-600 mt-0.5">missed</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-black text-amber-700">
                    {selectedReport.issues_count}
                  </p>
                  <p className="text-[10px] font-bold text-amber-600 mt-0.5">issues raised</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Survey Period:</span>
                  <span className="font-bold">{fmtDate(selectedReport.start_date)} → {fmtDate(selectedReport.end_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Cycle Number:</span>
                  <span className="font-bold">Cycle {selectedReport.cycle_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Status:</span>
                  <span className="font-bold capitalize text-blue-700">{selectedReport.status}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50"
                >
                  Close
                </button>
                <button className="flex-1 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center space-x-1.5 shadow-sm">
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF Report</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Individual report row component (matching Screenshot 4 list items)
function ReportRow({ report, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-5 py-4 hover:bg-slate-50/80 transition-colors group"
    >
      <div className="space-y-1.5">
        {/* Entity name + cycle label */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700">
            {report.entity_name}
          </span>
          {report.cycle_label && (
            <span className="text-[10px] font-semibold text-slate-400 shrink-0">
              {report.cycle_label.split('•')[0]?.trim()}
            </span>
          )}
        </div>

        {/* Title */}
        <p className="text-sm font-bold text-slate-900 leading-snug">
          {report.title}
        </p>

        {/* Stats pills row */}
        <div className="flex items-center space-x-3 pt-0.5">
          <div className="flex items-center space-x-1">
            <span className="text-emerald-600 text-[11px] font-bold">{report.completed_count} completed</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-rose-500 text-[11px] font-bold">{report.missed_count} missed</span>
          </div>
          <div className="flex items-center space-x-1 ml-auto">
            <span className="text-amber-600 text-[11px] font-semibold">{report.issues_count} issues</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-colors" />
          </div>
        </div>
      </div>
    </button>
  );
}
