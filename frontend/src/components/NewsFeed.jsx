import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Newspaper, RefreshCw, ExternalLink, Tag, Calendar, Search, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const NewsFeed = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchNews = async () => {
    try {
      setLoading(true);
      const data = await api.news.getNews({ limit: 20 });
      setArticles(data);
    } catch (err) {
      console.error('Failed to load news:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleSync = async () => {
    try {
      setRefreshing(true);
      await api.news.refresh('farmer agriculture crop monsoon rural');
      await fetchNews();
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const categories = [
    'All',
    'Agriculture',
    'Weather Alert',
    'Civic Administration',
    'Power & Irrigation',
    'Infrastructure',
    'Crop Disease & Pest',
  ];

  const filteredArticles = articles.filter((art) => {
    const matchCat = selectedCategory === 'All' || art.category === selectedCategory;
    const matchSearch =
      searchQuery === '' ||
      art.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const getSentimentBadge = (sentiment) => {
    if (sentiment === 'Critical' || sentiment === 'Negative') {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {sentiment}
        </span>
      );
    }
    if (sentiment === 'Positive') {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Positive
        </span>
      );
    }
    return (
      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300">
        Neutral
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-teal-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">
              Live Agricultural & Civic News Wire
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time news feeds ingested via NewsAPI and state press releases, feeding directly into Bedrock RAG.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={refreshing}
            className="px-4 py-2 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Sync Live Wire'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search news by keywords, crop, or location..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading live news wire...</div>
      ) : filteredArticles.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center text-slate-400">
          No news articles found matching the selected filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArticles.map((art) => (
            <div
              key={art.id}
              className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col justify-between glass-card-hover space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold text-teal-400 uppercase tracking-wider bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                    {art.category}
                  </span>
                  {getSentimentBadge(art.sentiment)}
                </div>

                <h4 className="font-bold text-sm text-white line-clamp-2 leading-snug">
                  {art.title}
                </h4>

                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {art.description || art.content || 'No detailed preview available.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-medium text-slate-300 truncate max-w-[140px]">
                    {art.source || 'News Wire'}
                  </span>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>{new Date(art.published_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {art.district_tags && (
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Tag className="w-3 h-3 text-teal-400" />
                    <span>Area: {art.district_tags}</span>
                  </div>
                )}

                {art.url && (
                  <a
                    href={art.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1 transition-colors"
                  >
                    <span>Read Full Dispatch</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsFeed;
