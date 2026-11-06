import React, { useState, useEffect, useRef } from 'react';
import { Send, CheckCircle2, Loader2, ExternalLink, ShieldCheck, Bell, Sparkles } from 'lucide-react';
import { api } from '../services/api';

/**
 * TelegramConnectCard
 * 1-Click Telegram Onboarding & Alerts Linking Component.
 * Automatically deep-links to @Bachega_bot with ?start=${currentUser.id}
 * and polls /api/alerts/telegram/status?user_id=${currentUser.id} every 3s.
 */
export default function TelegramConnectCard({
  currentUser,
  onVerified,
  isAlertChecked = false,
  onToggleAlert,
  className = '',
}) {
  const userId = currentUser?.id || currentUser?.user_id || 'usr_pitch_demo';

  // Persistence & Verification State
  const [verified, setVerified] = useState(() => {
    return localStorage.getItem('bachega_telegram_verified') === 'true' || Boolean(localStorage.getItem('bachega_telegram_chat_id'));
  });
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('bachega_telegram_username') || '';
  });

  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [testSending, setTestSending] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const pollIntervalRef = useRef(null);

  // Deep Link target
  const botLink = `https://t.me/Bachega_bot?start=${encodeURIComponent(userId)}`;

  // Polling logic: Checks status every 3 seconds
  useEffect(() => {
    if (!isPolling || verified) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    const checkStatus = async () => {
      try {
        setPollCount((c) => c + 1);
        const data = await api.getTelegramStatus(userId);
        if (data && data.verified) {
          const userHandle = data.telegram_username || 'borrower';
          setVerified(true);
          setUsername(userHandle);
          setIsPolling(false);

          // Save state in localStorage
          localStorage.setItem('bachega_telegram_verified', 'true');
          localStorage.setItem('bachega_telegram_username', userHandle);
          localStorage.setItem('bachega_telegram_enabled', 'true');

          // Notify parent callback
          if (onVerified) {
            onVerified({
              verified: true,
              username: userHandle,
            });
          }

          // Auto-check the Telegram alerts checkbox if toggle callback provided
          if (onToggleAlert && !isAlertChecked) {
            onToggleAlert(true);
          }
        }
      } catch (err) {
        // Silent failure during polling, keep trying
        console.debug('Polling telegram status:', err.message);
      }
    };

    // Run first check immediately, then every 3 seconds
    checkStatus();
    pollIntervalRef.current = setInterval(checkStatus, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isPolling, verified, userId, onVerified, onToggleAlert, isAlertChecked]);

  const handleConnectClick = () => {
    setErrorMsg(null);
    setIsPolling(true);
    // Open Telegram Bot with ?start=<user_id> in new tab
    window.open(botLink, '_blank', 'noopener,noreferrer');
  };

  const handleSendTestAlert = async () => {
    try {
      setTestSending(true);
      setErrorMsg(null);
      setTestSuccess(false);

      const targetChatId = localStorage.getItem('bachega_telegram_chat_id') || 'test_demo_chat';
      await api.sendTelegramAlert({
        chat_id: targetChatId,
        health_factor: 1.042,
        shock_pct: 35.0,
      });

      setTestSuccess(true);
      setTimeout(() => setTestSuccess(false), 4500);
    } catch (err) {
      setErrorMsg('Could not send test alert. Make sure bot was started.');
    } finally {
      setTestSending(false);
    }
  };

  return (
    <div
      className={`rounded-2xl p-6 border-2 border-black shadow-[4px_4px_0_#000] transition-all duration-300 relative overflow-hidden ${
        verified
          ? 'bg-[#86efac]/20'
          : 'bg-white'
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        {/* Header & Description */}
        <div className="space-y-1.5 max-w-md">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-[#fef08a] text-black border-2 border-black shadow-[1px_1px_0_#000]">
              <Send className="w-4 h-4" />
            </span>
            <h3 className="text-base font-black text-black tracking-tight">
              Link Telegram for Instant Push Alerts
            </h3>
          </div>
          <p className="text-xs text-black/80 font-sans leading-relaxed font-medium">
            Get real-time warnings before liquidation strikes your loan. When markets flash crash,
            @Bachega_bot sends immediate rescue advice directly to your phone.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:items-end gap-2 shrink-0">
          {!verified ? (
            <button
              type="button"
              onClick={handleConnectClick}
              className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-[#229ED9] hover:bg-[#1a8dc4] text-white text-xs font-black uppercase tracking-wider transition-all border-2 border-black shadow-[3px_3px_0_#000] active:translate-x-[1px] active:translate-y-[1px]"
            >
              <span>Connect @Bachega_bot</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#86efac] border-2 border-black text-[#065f46] text-xs font-mono font-black shadow-[2px_2px_0_#000]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#065f46]" />
                <span>Connected: @{username || 'BachegaUser'} ✓</span>
              </span>

              <button
                type="button"
                onClick={handleSendTestAlert}
                disabled={testSending}
                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#fef08a] text-black border-2 border-black shadow-[2px_2px_0_#000] text-[11px] font-black transition-all disabled:opacity-50 active:translate-x-[1px] active:translate-y-[1px]"
              >
                {testSending ? (
                  <span className="flex items-center space-x-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Sending...</span>
                  </span>
                ) : (
                  'Send Test Alert'
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Active Polling Status Indicator */}
      {isPolling && !verified && (
        <div className="mt-4 pt-3.5 border-t-2 border-black flex items-center justify-between text-xs text-black animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#229ED9] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#229ED9]" />
            </span>
            <span className="font-bold text-black">
              Waiting for you to tap <strong className="font-black text-[#229ED9]">START</strong> in Telegram...
            </span>
          </div>
          <span className="font-mono font-bold text-[10px] text-black/70 bg-[#fef08a] px-2 py-0.5 rounded border border-black shadow-[1px_1px_0_#000]">
            Polling ({pollCount * 3}s)
          </span>
        </div>
      )}

      {/* Verified Status Banner & Auto-checked Delivery Checkbox */}
      {verified && (
        <div className="mt-4 pt-3.5 border-t-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <label className="flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAlertChecked || true}
              onChange={(e) => onToggleAlert && onToggleAlert(e.target.checked)}
              className="w-4 h-4 rounded text-[#16a34a] focus:ring-[#86efac] border-2 border-black accent-[#16a34a]"
            />
            <span className="font-black text-black">
              Auto-Dispatch Liquidation Alerts to Telegram
            </span>
          </label>

          {testSuccess && (
            <span className="text-[11px] font-mono text-[#065f46] font-black bg-[#86efac] px-2 py-0.5 rounded border border-black shadow-[1px_1px_0_#000] animate-in fade-in">
              ⚡ Test alert sent! Check your Telegram chat.
            </span>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="mt-3 text-[11px] text-[#dc2626] font-mono font-bold">
          ⚠️ {errorMsg}
        </div>
      )}
    </div>
  );
}
