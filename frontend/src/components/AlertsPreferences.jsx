import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Phone,
  Mail,
  ExternalLink,
  Save,
  Loader2
} from 'lucide-react';
import { api } from '../services/api';

export default function AlertsPreferences() {
  const [prefs, setPrefs] = useState({
    hf_warning_threshold: 1.30,
    hf_critical_threshold: 1.10,
    price_drop_warning_pct: -15.0,
    liquidation_distance_warning_pct: 20.0,
    email_enabled: true,
    telegram_enabled: false,
    whatsapp_enabled: false,
    frequency: 'IMMEDIATE',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [channelToLink, setChannelToLink] = useState('telegram');
  const [channelIdentifier, setChannelIdentifier] = useState('');
  const [channelConsent, setChannelConsent] = useState(false);
  const [linkResult, setLinkResult] = useState(null);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    async function loadPreferences() {
      try {
        setLoading(true);
        const data = await api.getAlertPreferences();
        setPrefs(data);
      } catch (err) {
        setError('Failed to load alert preferences.');
      } finally {
        setLoading(false);
      }
    }
    loadPreferences();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);
    setSaveSuccess(false);

    if (prefs.hf_critical_threshold >= prefs.hf_warning_threshold) {
      setError('Critical threshold must be strictly lower than Warning threshold.');
      return;
    }

    try {
      setSaving(true);
      const updated = await api.updateAlertPreferences(prefs);
      setPrefs(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      setError(err.message || 'Failed to update alert preferences.');
    } finally {
      setSaving(false);
    }
  };

  const handleStartChannelLink = async (e) => {
    e.preventDefault();
    if (!channelConsent) {
      setError('Please check the consent box to authorize automated risk notifications.');
      return;
    }

    try {
      setLinking(true);
      setError(null);
      const res = await api.linkChannel({
        channel_type: channelToLink,
        identifier: channelIdentifier.trim(),
      });
      setLinkResult(res);
      if (channelToLink === 'telegram') {
        setPrefs(prev => ({ ...prev, telegram_enabled: true }));
      } else {
        setPrefs(prev => ({ ...prev, whatsapp_enabled: true }));
      }
    } catch (err) {
      setError(err.message || 'Failed to initiate channel link.');
    } finally {
      setLinking(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-slate-500 font-mono text-xs">
        Loading alert configurations...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-heritage font-extrabold text-slate-900 tracking-tight">Liquidation Alert Preferences</h2>
        <p className="text-xs text-slate-500 mt-1 font-sans">
          Configure proactive early-warning triggers and authenticated notification delivery channels.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center space-x-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Alert threshold preferences saved successfully.</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center space-x-2 font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Risk Threshold Sliders */}
        <div className="paper-card p-6 rounded-2xl space-y-6">
          <h3 className="text-base font-heritage font-bold text-slate-900 flex items-center space-x-2">
            <Bell className="w-4 h-4 text-terracotta" />
            <span>Health Factor & Crash Triggers</span>
          </h3>

          {/* Warning HF Threshold */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-700 font-semibold font-sans">Health Factor Warning Threshold</span>
              <span className="font-mono font-bold text-brass text-sm">
                HF &lt; {prefs.hf_warning_threshold.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="1.15"
              max="2.00"
              step="0.05"
              value={prefs.hf_warning_threshold}
              onChange={(e) => setPrefs({ ...prefs, hf_warning_threshold: parseFloat(e.target.value) })}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brass"
            />
            <p className="text-[11px] text-slate-500 font-sans">
              Sends an early advisory digest when your position slips into the tension zone.
            </p>
          </div>

          {/* Critical HF Threshold */}
          <div className="space-y-2 pt-2 border-t border-amber-900/10">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-700 font-semibold font-sans">Health Factor Critical Threshold</span>
              <span className="font-mono font-bold text-carmine text-sm">
                HF &lt; {prefs.hf_critical_threshold.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="1.02"
              max="1.25"
              step="0.01"
              value={prefs.hf_critical_threshold}
              onChange={(e) => setPrefs({ ...prefs, hf_critical_threshold: parseFloat(e.target.value) })}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-carmine"
            />
            <p className="text-[11px] text-slate-500 font-sans">
              High-priority immediate push alert when position is within arm's reach of liquidation (HF 1.00).
            </p>
          </div>

          {/* Price drop warning */}
          <div className="space-y-2 pt-2 border-t border-amber-900/10">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-700 font-semibold font-sans">24-Hour Collateral Flash Crash Trigger</span>
              <span className="font-mono font-bold text-carmine text-sm">
                {prefs.price_drop_warning_pct.toFixed(0)}% Drop
              </span>
            </div>
            <input
              type="range"
              min="-40"
              max="-5"
              step="5"
              value={prefs.price_drop_warning_pct}
              onChange={(e) => setPrefs({ ...prefs, price_drop_warning_pct: parseFloat(e.target.value) })}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-carmine"
            />
          </div>

          {/* Liquidation distance warning */}
          <div className="space-y-2 pt-2 border-t border-amber-900/10">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-700 font-semibold font-sans">Liquidation Distance Warning</span>
              <span className="font-mono font-bold text-brass text-sm">
                Within {prefs.liquidation_distance_warning_pct.toFixed(0)}% of Liquidation Price
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="35"
              step="5"
              value={prefs.liquidation_distance_warning_pct}
              onChange={(e) => setPrefs({ ...prefs, liquidation_distance_warning_pct: parseFloat(e.target.value) })}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brass"
            />
          </div>
        </div>

        {/* Channels Configuration */}
        <div className="paper-card p-6 rounded-2xl space-y-4">
          <h3 className="text-base font-heritage font-bold text-slate-900 flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-deck" />
            <span>Delivery Channels & Verified Opt-Ins</span>
          </h3>

          <div className="space-y-3">
            {/* Telegram Channel */}
            <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-900/15 flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-900 border border-blue-300 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-heritage font-bold text-slate-900">Telegram Alerts Bot</h4>
                  <p className="text-xs text-slate-600 font-sans">Instant push notifications for critical liquidation risks</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setChannelToLink('telegram');
                    setLinkResult(null);
                    setLinkModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-amber-100 text-slate-800 text-xs font-bold border border-amber-900/20 transition-colors shadow-sm"
                >
                  Verify Channel
                </button>
                <input
                  type="checkbox"
                  checked={prefs.telegram_enabled}
                  onChange={(e) => setPrefs({ ...prefs, telegram_enabled: e.target.checked })}
                  className="w-4 h-4 rounded text-terracotta focus:ring-terracotta border-amber-900/30"
                />
              </div>
            </div>

            {/* WhatsApp Channel */}
            <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-900/15 flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-heritage font-bold text-slate-900">WhatsApp Emergency Alerts</h4>
                  <p className="text-xs text-slate-600 font-sans">Direct WhatsApp dispatch during sudden market crashes</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setChannelToLink('whatsapp');
                    setLinkResult(null);
                    setLinkModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-amber-100 text-slate-800 text-xs font-bold border border-amber-900/20 transition-colors shadow-sm"
                >
                  Verify Channel
                </button>
                <input
                  type="checkbox"
                  checked={prefs.whatsapp_enabled}
                  onChange={(e) => setPrefs({ ...prefs, whatsapp_enabled: e.target.checked })}
                  className="w-4 h-4 rounded text-terracotta focus:ring-terracotta border-amber-900/30"
                />
              </div>
            </div>

            {/* Email Channel */}
            <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-900/15 flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-heritage font-bold text-slate-900">Email Digest & Alerts</h4>
                  <p className="text-xs text-slate-600 font-sans">Sent to registered account address (investor@bachega.app)</p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={prefs.email_enabled}
                onChange={(e) => setPrefs({ ...prefs, email_enabled: e.target.checked })}
                className="w-4 h-4 rounded text-terracotta focus:ring-terracotta border-amber-900/30"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-terracotta hover:bg-terracotta-700 text-white font-bold text-xs transition-all shadow-terracotta disabled:opacity-50 flex items-center space-x-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Preferences...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Alert Preferences</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Channel Verification Challenge Modal */}
      {linkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#fcfbf7] border border-amber-900/25 rounded-2xl p-6 shadow-2xl paper-card">
            <h3 className="text-base font-heritage font-bold text-slate-900 capitalize mb-1">
              Verify {channelToLink} Opt-In
            </h3>
            <p className="text-xs text-slate-600 mb-4 font-sans">
              Two-factor channel handshake ensures only you receive critical liquidation alerts.
            </p>

            {!linkResult ? (
              <form onSubmit={handleStartChannelLink} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-mono">
                    {channelToLink === 'telegram' ? 'Telegram Handle / Username' : 'Phone Number (E.164 with Country Code)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={channelIdentifier}
                    onChange={(e) => setChannelIdentifier(e.target.value)}
                    placeholder={channelToLink === 'telegram' ? '@your_username' : '+1 (555) 234-5678'}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-amber-900/20 text-slate-900 text-xs font-mono focus:outline-none focus:border-terracotta shadow-sm"
                  />
                </div>

                {/* Explicit Consent Checkbox */}
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start space-x-2.5">
                  <input
                    type="checkbox"
                    id="consent_checkbox"
                    checked={channelConsent}
                    onChange={(e) => setChannelConsent(e.target.checked)}
                    className="mt-0.5 rounded text-terracotta focus:ring-terracotta border-amber-900/30"
                  />
                  <label htmlFor="consent_checkbox" className="text-[11px] text-amber-950/80 leading-snug font-sans">
                    I explicitly consent to receive automated DeFi risk and crash simulation alert notifications via {channelToLink}. I understand this is an informational tool, not financial advice.
                  </label>
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setLinkModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={linking || !channelConsent}
                    className="px-5 py-2.5 rounded-xl bg-terracotta hover:bg-terracotta-700 text-white font-bold text-xs shadow-terracotta disabled:opacity-50"
                  >
                    {linking ? 'Generating Challenge...' : 'Generate Verification Challenge'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-amber-100/70 border border-amber-300 text-center space-y-1.5">
                  <span className="text-[10px] font-mono text-amber-900 font-bold uppercase tracking-widest">Verification Challenge Code</span>
                  <div className="text-xl font-mono font-extrabold text-slate-900 tracking-widest">
                    {linkResult.verification_code}
                  </div>
                  <span className="text-[10px] text-slate-500 block">Valid for 15 minutes</span>
                </div>

                <div className="text-xs text-slate-700 leading-relaxed bg-white p-4 rounded-xl border border-amber-900/15">
                  <strong className="text-slate-900 block mb-1 font-mono">Instructions:</strong>
                  {linkResult.verification_instructions}
                </div>

                {linkResult.deep_link && (
                  <a
                    href={linkResult.deep_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition-colors"
                  >
                    <span>Open in {channelToLink}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setLinkModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-terracotta hover:bg-terracotta-700 text-white font-bold text-xs"
                >
                  I Have Sent The Verification Code
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
