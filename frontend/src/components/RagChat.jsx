import React, { useState } from 'react';
import { api } from '../services/api';
import { Sparkles, Send, Bot, ShieldCheck, FileText, Newspaper, HelpCircle, Loader2, RefreshCw } from 'lucide-react';

export const RagChat = ({ district = 'Coimbatore' }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const presetQueries = [
    {
      label: '🏛️ Daily District Briefing',
      text: `Generate a comprehensive daily agricultural and civic intelligence briefing for ${district}. Highlight urgent hotspots and recommend executive actions.`,
    },
    {
      label: '💧 Irrigation & Canal Siltation',
      text: `Analyze all citizen grievances regarding water scarcity and canal siltation. What are the key affected taluks and what PWD interventions are needed?`,
    },
    {
      label: '🐛 Pest Outbreak vs Weather',
      text: `Correlate recent citizen reports on crop diseases and pest attacks with the latest agricultural news alerts and rainfall patterns.`,
    },
    {
      label: '⚖️ Fertilizer Black-Market Check',
      text: `Summarize reports regarding fertilizer retail overcharging, black-market sales, and seed quality issues across district cooperatives.`,
    },
  ];

  const handleQuery = async (queryText) => {
    const textToSend = queryText || query;
    if (!textToSend.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await api.rag.query({
        query: textToSend,
        district: district,
        include_news: true,
        include_complaints: true,
      });
      setResult(data);
    } catch (err) {
      console.error('RAG query error:', err);
      setError('Failed to reach Bedrock intelligence service. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Sparkles className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Amazon Bedrock RAG Intelligence Engine
              </h2>
            </div>
            <p className="text-sm text-slate-300 max-w-2xl">
              Retrieval-Augmented Generation synthesizes live citizen field grievances with fresh agricultural news wire articles to generate executive directives for the District Collector.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Model: Claude 3 / Titan</span>
            </div>
          </div>
        </div>

        {/* Preset Query Chips */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Quick Executive Prompts:
          </div>
          <div className="flex flex-wrap gap-2">
            {presetQueries.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(item.text);
                  handleQuery(item.text);
                }}
                disabled={loading}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-emerald-600/20 hover:text-emerald-300 hover:border-emerald-500/40 text-slate-300 border border-slate-700 transition-all font-medium flex items-center gap-1.5 disabled:opacity-50"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Query Input Box */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleQuery(query);
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask Bedrock anything... (e.g. 'Which taluks face maximum irrigation deficit this week?')"
            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Analyze</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Loading state indicator */}
      {loading && (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <div className="text-white font-semibold text-sm">
            Retrieving Ground Grievances & News Intel...
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Amazon Bedrock is vector-correlating citizen grievance records, location coordinates, and news reports into a structured executive briefing.
          </p>
        </div>
      )}

      {/* Synthesis Result Display */}
      {result && !loading && (
        <div className="space-y-6">
          {/* Main Strategic Response Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Bedrock Executive Synthesis
                </span>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                {result.model_used}
              </span>
            </div>

            {/* Formatted Markdown-like Response */}
            <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed whitespace-pre-line space-y-2">
              {result.response}
            </div>

            {/* Key Action Directives */}
            {result.recommended_actions?.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-800 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Recommended Field Directives:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {result.recommended_actions.map((act, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200 flex items-start gap-2"
                    >
                      <span className="font-bold text-amber-400">#{i + 1}</span>
                      <span>{act}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Grounding Sources (Grievance + News Citations) */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                RAG Grounded Citations & Sources ({result.sources?.length || 0} Retrieved)
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {result.sources?.map((s, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        s.type === 'Grievance'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {s.type} {s.id ? `#${s.id}` : ''}
                    </span>
                    {s.priority && (
                      <span className="text-[10px] text-slate-400">{s.priority} Priority</span>
                    )}
                  </div>
                  <div className="font-semibold text-white line-clamp-2">{s.title}</div>
                  {s.source && <div className="text-[11px] text-slate-400">Source: {s.source}</div>}
                  {s.category && (
                    <div className="text-[11px] text-slate-400">Category: {s.category}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RagChat;
