import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Cpu, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Send, 
  Bot, 
  Newspaper, 
  Sliders, 
  Check, 
  X,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';

export default function AiTriageDrawer({ onTasksUpdated }) {
  const [activeProvider, setActiveProvider] = useState('gemini');
  const [providerConfig, setProviderConfig] = useState(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');

  // Triage state
  const [isTriaging, setIsTriaging] = useState(false);
  const [triageReport, setTriageReport] = useState(null);

  // RAG Assistant state
  const [ragQuery, setRagQuery] = useState('');
  const [ragResponse, setRagResponse] = useState(null);
  const [isAskingRag, setIsAskingRag] = useState(false);

  const fetchProviderStatus = async () => {
    try {
      const data = await api.rag.getProvider();
      setActiveProvider(data.active_provider || 'gemini');
      setProviderConfig(data);
    } catch (err) {
      console.warn('Provider check fallback:', err);
    }
  };

  useEffect(() => {
    fetchProviderStatus();
  }, []);

  const handleSwitchProvider = async (target) => {
    try {
      setIsSwitching(true);
      await api.rag.switchProvider(target, apiKeyInput || undefined);
      setActiveProvider(target);
      fetchProviderStatus();
    } catch (err) {
      console.error('Failed to switch provider:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleRunTriage = async () => {
    try {
      setIsTriaging(true);
      const res = await api.news.triageWire('Madurai');
      setTriageReport(res);
      if (onTasksUpdated) onTasksUpdated();
    } catch (err) {
      console.error('Triage run error:', err);
    } finally {
      setIsTriaging(false);
    }
  };

  const handleAskRag = async (e) => {
    e.preventDefault();
    if (!ragQuery.trim()) return;
    try {
      setIsAskingRag(true);
      const res = await api.rag.query(ragQuery);
      setRagResponse(res);
    } catch (err) {
      console.error('RAG query error:', err);
    } finally {
      setIsAskingRag(false);
    }
  };

  return (
    <div className="fimms-card p-5 space-y-6">
      
      {/* Header & LLM Provider Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>AI News Wire Ingestion & RAG Deduplication Center</span>
          </h3>
          <p className="text-xs text-slate-500">
            Powered by RAG vector indexing. Extracts only unique tasks and clusters duplicate media reports.
          </p>
        </div>

        {/* Provider Switcher Toggle (Gemini default vs Bedrock) */}
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
          <span className="text-[11px] font-bold text-slate-500 uppercase px-2">LLM Provider:</span>
          
          <button
            onClick={() => handleSwitchProvider('gemini')}
            disabled={isSwitching}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeProvider === 'gemini'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${activeProvider === 'gemini' ? 'bg-blue-600' : 'bg-slate-300'}`} />
            <span>Google Gemini (Default)</span>
          </button>

          <button
            onClick={() => handleSwitchProvider('bedrock')}
            disabled={isSwitching}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeProvider === 'bedrock'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${activeProvider === 'bedrock' ? 'bg-amber-600' : 'bg-slate-300'}`} />
            <span>AWS Bedrock</span>
          </button>
        </div>
      </div>

      {/* Action Banner to Run Live Deduplication */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-4 border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-blue-500/20">
            <Newspaper className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Live District News API Crawler & Deduplicator
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Crawls regional news feeds for Madurai & surroundings, generates 768-dim embeddings, queries pgvector HNSW index, and lets Gemini/Bedrock identify unique tasks.
            </p>
          </div>
        </div>

        <button
          onClick={handleRunTriage}
          disabled={isTriaging}
          className="self-start sm:self-center shrink-0 flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isTriaging ? 'animate-spin' : ''}`} />
          <span>{isTriaging ? 'Analyzing News Wire...' : 'Fetch & Triage News'}</span>
        </button>
      </div>

      {/* Triage Results Display */}
      {triageReport && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Triage Results Summary:
            </h4>
            <div className="flex items-center space-x-2 text-xs">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                +{triageReport.unique_tasks_created} Unique Tasks Registered
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                {triageReport.duplicate_clusters_updated} Clusters Updated
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {triageReport.results?.map((item, idx) => {
              const v = item.verdict;
              const art = item.article;
              const isUnique = v?.is_unique;

              return (
                <div 
                  key={idx} 
                  className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                    isUnique 
                      ? 'bg-emerald-50/50 border-emerald-200' 
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      isUnique 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-slate-600 text-white'
                    }`}>
                      {isUnique ? '★ UNIQUE TASK IDENTIFIED' : '🔗 DUPLICATE MERGED'}
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      Confidence: {Math.round((v?.confidence || 0.95) * 100)}%
                    </span>
                  </div>

                  <p className="font-bold text-slate-900 leading-snug">
                    {art.title}
                  </p>

                  <p className="text-slate-600 text-[11px] line-clamp-2">
                    {art.description}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-white/90 border border-slate-200 text-slate-700 font-semibold text-[10px]">
                      <span>📰 {art.source || 'Regional News Wire'}</span>
                    </span>
                    {art.url && (
                      <a
                        href={art.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-bold hover:underline"
                      >
                        <span>View Source Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="p-2 bg-white rounded-lg border border-slate-100 text-[11px] text-slate-700 space-y-1">
                    <p className="font-semibold text-slate-800">
                      {isUnique ? 'Action Recommended:' : 'Deduplication Reason:'}
                    </p>
                    <p className="text-slate-600 italic">
                      {isUnique ? v?.extracted_task?.recommended_action : v?.duplicate_reason}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Strategic Collector RAG Assistant */}
      <div className="border-t border-slate-100 pt-5 space-y-3">
        <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <Bot className="w-4 h-4 text-blue-600" />
          <span>Strategic Collector RAG Intelligence Assistant</span>
        </h4>
        <p className="text-xs text-slate-500">
          Ask questions against indexed field inspection surveys, hostels, and news wire records.
        </p>

        {/* Quick prompt suggestions */}
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          {[
            'Summarize critical issues in Thiruparankundram and Melur',
            'Which mandal/taluk has the lowest health index?',
            'List all drinking water contamination reports in hostels'
          ].map((prompt, i) => (
            <button
              key={i}
              onClick={() => setRagQuery(prompt)}
              className="text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-full transition-colors"
            >
              "{prompt}"
            </button>
          ))}
        </div>

        <form onSubmit={handleAskRag} className="flex gap-2">
          <input
            type="text"
            placeholder="Ask strategic query to Gemini / Bedrock RAG assistant..."
            value={ragQuery}
            onChange={(e) => setRagQuery(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isAskingRag}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isAskingRag ? 'Querying...' : 'Ask Assistant'}</span>
          </button>
        </form>

        {/* RAG Answer Display */}
        {ragResponse && (
          <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 text-xs space-y-3 font-sans shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-blue-400 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Executive Intelligence Briefing</span>
              </span>
              <span className="text-[10px] text-slate-400">
                Generated via {ragResponse.active_provider === 'gemini' ? 'Google Gemini' : 'AWS Bedrock'} RAG ({ragResponse.sources_count} sources)
              </span>
            </div>

            <div className="prose prose-invert prose-xs leading-relaxed whitespace-pre-wrap">
              {ragResponse.answer}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
