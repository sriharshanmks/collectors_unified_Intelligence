import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { AlertOctagon, CheckCircle2, Clock, TrendingUp, BarChart3, PieChart as PieIcon, Layers } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

export const EdaCharts = ({ stats }) => {
  if (!stats) {
    return (
      <div className="p-8 text-center text-slate-400">
        Loading EDA analytical telemetry...
      </div>
    );
  }

  // Priority Chart Data
  const priorityLabels = ['Critical', 'High', 'Medium', 'Low'];
  const priorityData = {
    labels: priorityLabels,
    datasets: [
      {
        label: 'Number of Grievances',
        data: [
          stats.critical_count || 0,
          stats.high_count || 0,
          stats.medium_count || 0,
          stats.low_count || 0,
        ],
        backgroundColor: [
          'rgba(239, 68, 68, 0.85)',   // Red
          'rgba(249, 115, 22, 0.85)',  // Orange
          'rgba(234, 179, 8, 0.85)',   // Yellow
          'rgba(16, 185, 129, 0.85)',  // Green
        ],
        borderColor: [
          '#ef4444',
          '#f97316',
          '#eab308',
          '#10b981',
        ],
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  // Category Doughnut Data
  const categoryLabels = Object.keys(stats.by_category || {});
  const categoryCounts = Object.values(stats.by_category || {});
  const categoryColors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ec4899', // pink
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#ef4444', // red
    '#14b8a6', // teal
  ];

  const categoryData = {
    labels: categoryLabels,
    datasets: [
      {
        data: categoryCounts,
        backgroundColor: categoryColors.slice(0, categoryLabels.length),
        borderColor: '#0f172a',
        borderWidth: 2,
      },
    ],
  };

  // Taluk Horizontal Bar Data
  const talukLabels = Object.keys(stats.by_taluk || {});
  const talukCounts = Object.values(stats.by_taluk || {});
  const talukData = {
    labels: talukLabels,
    datasets: [
      {
        label: 'Grievances in Taluk',
        data: talukCounts,
        backgroundColor: 'rgba(20, 184, 166, 0.75)',
        borderColor: '#14b8a6',
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  // Influx Trend Line Data
  const trendLabels = (stats.by_month_trend || []).map((t) => t.date);
  const trendCounts = (stats.by_month_trend || []).map((t) => t.count);
  const trendData = {
    labels: trendLabels.length ? trendLabels : ['Day 1', 'Day 3', 'Day 5', 'Day 7', 'Day 9'],
    datasets: [
      {
        fill: true,
        label: 'Grievance Volume',
        data: trendCounts.length ? trendCounts : [2, 4, 3, 6, 8],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        tension: 0.35,
        pointBackgroundColor: '#10b981',
        pointRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#cbd5e1',
          font: { size: 11 },
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#e2e8f0',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
      },
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8', font: { size: 10 } },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      y: {
        ticks: { color: '#94a3b8', font: { size: 10 }, stepSize: 1 },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#cbd5e1',
          font: { size: 10 },
          boxWidth: 12,
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#e2e8f0',
        borderColor: '#334155',
        borderWidth: 1,
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Grievances */}
        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Logged
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-white">{stats.total_complaints}</div>
          <div className="mt-1 text-xs text-slate-400">Citizen reported incidents</div>
        </div>

        {/* Critical / High Alerts */}
        <div className="glass-card p-4 rounded-2xl border border-red-500/30 bg-red-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-300">
              Critical Urgency
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center critical-pulse">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-red-400">
            {stats.critical_count}
            <span className="text-sm font-normal text-orange-300 ml-2">
              (+{stats.high_count} High)
            </span>
          </div>
          <div className="mt-1 text-xs text-red-300/80">Requires immediate dispatch</div>
        </div>

        {/* Active In-Investigation */}
        <div className="glass-card p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Action Initiated
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-400">{stats.in_action_count}</div>
          <div className="mt-1 text-xs text-slate-400">Under department review</div>
        </div>

        {/* Resolution Rate */}
        <div className="glass-card p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
              Resolution Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400">
            {stats.resolution_rate}%
          </div>
          <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(stats.resolution_rate, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Grid of Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Priority Breakdown */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Priority Distribution</h3>
            </div>
            <span className="text-[11px] text-slate-400">Auto-classified via Bedrock AI</span>
          </div>
          <div className="h-64 w-full">
            <Bar data={priorityData} options={chartOptions} />
          </div>
        </div>

        {/* Chart 2: Category Breakdown */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-teal-400" />
              <h3 className="text-sm font-bold text-white">Issue Category Breakdown</h3>
            </div>
            <span className="text-[11px] text-slate-400">Grievance clusters</span>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            <Doughnut data={categoryData} options={doughnutOptions} />
          </div>
        </div>

        {/* Chart 3: Taluk Geographic Load */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Taluk / Block Volume</h3>
            </div>
            <span className="text-[11px] text-slate-400">Administrative boundaries</span>
          </div>
          <div className="h-64 w-full">
            <Bar data={talukData} options={chartOptions} />
          </div>
        </div>

        {/* Chart 4: Influx Trend Line */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Grievance Surge Trend</h3>
            </div>
            <span className="text-[11px] text-slate-400">Temporal pattern</span>
          </div>
          <div className="h-64 w-full">
            <Line data={trendData} options={chartOptions} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default EdaCharts;
