import React, { useState } from 'react';
import { api } from '../services/api';
import { X, MapPin, Upload, Sparkles, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

export const ComplaintModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Water Scarcity',
    description: '',
    district: 'Coimbatore',
    taluk: 'Pollachi',
    village: '',
    latitude: 10.9984,
    longitude: 76.9629,
    address: '',
    image_url: '',
  });

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [geoLocating, setGeoLocating] = useState(false);

  if (!isOpen) return null;

  const categories = [
    'Water Scarcity',
    'Crop Disease & Pest',
    'Fertilizer & Seed',
    'Power & Irrigation',
    'Roads & Transport',
    'Disaster / Flood / Drought',
    'Market Pricing & MSP',
    'Other Civic Issue',
  ];

  const taluks = [
    'Pollachi',
    'Annur',
    'Sulur',
    'Mettupalayam',
    'Thondamuthur',
    'Kinathukadavu',
    'Coimbatore South',
    'Coimbatore North',
  ];

  const handleUseGps = () => {
    if (navigator.geolocation) {
      setGeoLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData((prev) => ({
            ...prev,
            latitude: Number(pos.coords.latitude.toFixed(5)),
            longitude: Number(pos.coords.longitude.toFixed(5)),
          }));
          setGeoLocating(false);
        },
        (err) => {
          console.warn('Geolocation error:', err);
          setGeoLocating(false);
          alert('Could not access GPS. Using default district coordinates.');
        }
      );
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await api.complaints.uploadEvidence(file);
      setFormData((prev) => ({ ...prev, image_url: res.url }));
    } catch (err) {
      console.error('File upload failed:', err);
      alert('Photo upload failed. You can still submit the complaint.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Please provide a title and detailed description.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.complaints.create(formData);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Submission error:', err);
      setError('Failed to lodge grievance. Please verify fields and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl relative my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1 mb-6">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <MapPin className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-bold text-white">File Citizen Grievance & Intel Report</h2>
          </div>
          <p className="text-xs text-slate-400">
            Submit on-ground agricultural distress or civic issues. Amazon Bedrock AI will automatically triage severity, assign priority, and notify the District Collector.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Issue Headline / Summary <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Silt accumulation in PAP canal blocking water to 50 acres"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Category & Taluk in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Category <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Taluk / Block <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.taluk}
                onChange={(e) => setFormData({ ...formData, taluk: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {taluks.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Village & Landmark */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Village / Panchayat</label>
              <input
                type="text"
                placeholder="e.g. Sultanpet / Anaimalai"
                value={formData.village}
                onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Specific Landmark / Survey No.</label>
              <input
                type="text"
                placeholder="e.g. Near Feeder #4, North Canal Sluice"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Detailed Ground Description <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Describe the issue in detail: crops affected, number of farmers impacted, how long the issue has persisted, previous attempts made..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Coordinates & Geolocation */}
          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">Geospatial Coordinates:</span>
              <button
                type="button"
                onClick={handleUseGps}
                disabled={geoLocating}
                className="px-2.5 py-1 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30 transition-all font-medium flex items-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{geoLocating ? 'Locating...' : 'Detect GPS Location'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-slate-400 font-mono text-[11px]">
              <div>Latitude: <strong className="text-white">{formData.latitude}</strong></div>
              <div>Longitude: <strong className="text-white">{formData.longitude}</strong></div>
            </div>
          </div>

          {/* Evidence Upload */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Evidence Photo / Document (Saved to Amazon S3 / Secure Storage)
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700/60 flex items-center gap-2 transition-all">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>{uploading ? 'Uploading to S3...' : 'Upload Photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {formData.image_url && (
                <span className="text-emerald-400 text-xs flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Photo Attached
                </span>
              )}
            </div>
          </div>

          {/* Bedrock AI triage note */}
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-[11px] text-emerald-300 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Upon submission, <strong>Amazon Bedrock</strong> will analyze your report, score urgency from 1 to 100, identify relevant department protocols, and display it instantly on the District Collector's GIS Problem Map.
            </span>
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting to Bedrock...</span>
                </>
              ) : (
                <span>Submit Grievance</span>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default ComplaintModal;
