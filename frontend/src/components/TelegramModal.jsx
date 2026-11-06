import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  BellRing,
  Bot
} from 'lucide-react';
import { api } from '../services/api';

const BOT_USERNAME = 'Bachega_bot';

export default function TelegramModal({
  isOpen,
  onClose,
  onTelegramVerified,
  initialChatId,
  initialUsername,
  currentUser,
}) {
  const userId = currentUser?.id || currentUser?.user_id || 'usr_pitch_demo';
  const botLink = `https://t.me/${BOT_USERNAME}?start=${encodeURIComponent(userId)}`;

  const [inputChatId, setInputChatId] = useState(
    () => initialChatId || localStorage.getItem('bachega_telegram_chat_id') || ''
  );

  const handleManualSaveChatId = () => {
    const clean = inputChatId.trim();
    if (!clean) {
      setError('Please enter a valid numeric Telegram Chat ID.');
      return;
    }
    setChatId(clean);
    setVerified(true);
    setError(null);
    localStorage.setItem('bachega_telegram_chat_id', clean);
    localStorage.setItem('bachega_telegram_verified', 'true');
    if (onTelegramVerified) {
      onTelegramVerified({
        verified: true,
        chat_id: clean,
        username: username || 'Borrower',
      });
    }
  };
  const [username, setUsername] = useState(
    () => initialUsername || localStorage.getItem('bachega_telegram_username') || ''
  );
  const [verified, setVerified] = useState(
    () => localStorage.getItem('bachega_telegram_verified') === 'true' || Boolean(initialChatId)
  );

  const [verifying, setVerifying] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);
  const [error, setError] = useState(null);
  const [alertSuccess, setAlertSuccess] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  const pollIntervalRef = useRef(null);

  // Auto-polling for deep-link confirmation while modal is open
  useEffect(() => {
    if (!isOpen || verified) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    const checkStatus = async () => {
      try {
        const data = await api.getTelegramStatus(userId);
        if (data && data.verified) {
          const userHandle = data.telegram_username || 'borrower';
          setVerified(true);
          setUsername(userHandle);
          setChatId(data.chat_id || 'active_chat');

          localStorage.setItem('bachega_telegram_verified', 'true');
          localStorage.setItem('bachega_telegram_username', userHandle);
          localStorage.setItem('bachega_telegram_enabled', 'true');

          if (onTelegramVerified) {
            onTelegramVerified({
              verified: true,
              chat_id: data.chat_id || 'active_chat',
              username: userHandle,
            });
          }
        }
      } catch (e) {
        // Silent failure during polling
      }
    };

    pollIntervalRef.current = setInterval(checkStatus, 3000);
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isOpen, verified, userId, onTelegramVerified]);

  if (!isOpen) return null;

  const handleOpenBot = () => {
    setIsPolling(true);
    window.open(botLink, '_blank', 'noopener,noreferrer');
  };

  const handleVerify = async () => {
    setVerifying(true);
    setError(null);
    setAlertSuccess(false);

    try {
      // 1. First check user_id status
      const statusRes = await api.getTelegramStatus(userId);
      if (statusRes && statusRes.verified) {
        const userHandle = statusRes.telegram_username || 'Borrower';
        setUsername(userHandle);
        setChatId('active_chat');
        setVerified(true);

        localStorage.setItem('bachega_telegram_verified', 'true');
        localStorage.setItem('bachega_telegram_username', userHandle);

        if (onTelegramVerified) {
          onTelegramVerified({
            chat_id: 'active_chat',
            username: userHandle,
          });
        }
        return;
      }

      // 2. Fallback to global verifyTelegram endpoint
      const res = await api.verifyTelegram();
      if (res.success && res.chat_id) {
        setChatId(res.chat_id);
        const resolvedUser = res.username || 'Borrower';
        setUsername(resolvedUser);
        setVerified(true);

        localStorage.setItem('bachega_telegram_chat_id', res.chat_id);
        localStorage.setItem('bachega_telegram_username', resolvedUser);
        localStorage.setItem('bachega_telegram_verified', 'true');

        if (onTelegramVerified) {
          onTelegramVerified({
            chat_id: res.chat_id,
            username: resolvedUser,
          });
        }
      } else {
        setError(res.message || 'No chat found yet. Please tap Start in the Telegram bot chat first.');
      }
    } catch (err) {
      setError(err.message || 'Failed to verify with Telegram API. Ensure backend is reachable.');
    } finally {
      setVerifying(false);
    }
  };

  const handleSendTestAlert = async () => {
    setSendingAlert(true);
    setError(null);
    setAlertSuccess(false);

    try {
      const targetChatId = chatId || inputChatId || localStorage.getItem('bachega_telegram_chat_id');
      if (!targetChatId || targetChatId === 'demo_chat_verified' || targetChatId === 'test_demo_chat') {
        throw new Error('Please enter your numeric Telegram Chat ID above (from @userinfobot) so the alert can be delivered to your phone.');
      }

      const res = await api.sendTelegramAlert({
        chat_id: String(targetChatId),
        health_factor: 1.048,
        shock_pct: 25.0,
      });

      if (res && res.success !== false) {
        setAlertSuccess(true);
        setTimeout(() => setAlertSuccess(false), 8000);
      } else {
        setError(res.message || 'Failed to dispatch test alert.');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with Telegram alert system.');
    } finally {
      setSendingAlert(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border-2 border-black shadow-[6px_6px_0_#000] rounded-2xl overflow-hidden">
        {/* Top Solid Black Ribbon */}
        <div className="h-2 bg-black w-full" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-[#fef08a]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#229ED9] text-white flex items-center justify-center font-black text-sm border-2 border-black shadow-[1px_1px_0_#000]">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black text-black">
                Telegram Alerts Bot (@{BOT_USERNAME})
              </h3>
              <p className="text-[11px] text-black/70 font-medium">
                Live Liquidation Warnings &amp; Quant Chatbot
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-black hover:bg-black/10 p-1.5 rounded-lg transition-colors border border-black/20"
          >
            <X className="w-5 h-5 text-black" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Step 1: Open Bot on Telegram */}
          <div className="p-4 rounded-xl bg-white border-2 border-black shadow-[3px_3px_0_#000] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-black uppercase tracking-wider text-black">
                STEP 1: INITIATE BOT CHAT
              </span>
              <span className="text-[10px] font-mono font-black bg-[#229ED9] text-white px-2 py-0.5 rounded border border-black shadow-[1px_1px_0_#000]">
                1-CLICK LINK
              </span>
            </div>

            <p className="text-xs text-black/80 leading-relaxed font-sans font-medium">
              Click below to open <strong>@{BOT_USERNAME}</strong> in Telegram and press <strong>START</strong>. This authorizes automated liquidation alerts and stress-test chat.
            </p>

            <button
              type="button"
              onClick={handleOpenBot}
              className="w-full btn-3d-royal py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center space-x-2"
            >
              <span>1. Open @{BOT_USERNAME} on Telegram</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Step 2: Verification Status & Button */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-black uppercase tracking-wider text-black">
                STEP 2: CONFIRM CONNECTION
              </span>
              {verified && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-black bg-[#86efac] text-[#065f46] border-2 border-black shadow-[1px_1px_0_#000]">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {chatId ? `ID: ${chatId}` : `@${username || 'Borrower'}`}
                </span>
              )}
            </div>

            {/* Direct Chat ID Input for Real Instant Push Delivery */}
            <div className="p-3 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0_#000] space-y-2">
              <label className="block text-[11px] font-mono font-black text-black">
                Your Telegram Numeric Chat ID:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 582910394"
                  value={inputChatId}
                  onChange={(e) => setInputChatId(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-[#fffdf5] border-2 border-black text-xs font-mono font-black text-black focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleManualSaveChatId}
                  className="px-3 py-1.5 rounded-lg bg-[#fef08a] border-2 border-black text-xs font-black shadow-[1px_1px_0_#000] hover:bg-[#fde047] active:translate-x-[1px] active:translate-y-[1px]"
                >
                  Save ID
                </button>
              </div>
              <p className="text-[10px] text-black/70 font-mono">
                💡 Don't know your ID? Open <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="underline font-bold text-[#2563eb]">@userinfobot</a> on Telegram to see your numeric ID instantly.
              </p>
            </div>

            <button
              type="button"
              onClick={handleVerify}
              disabled={verifying}
              className="w-full btn-3d-gold py-2 px-4 rounded-xl font-black text-xs flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Checking Latest Updates...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-black" />
                  <span>Auto-Detect from @{BOT_USERNAME}</span>
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-[#fee2e2] border-2 border-black shadow-[2px_2px_0_#000] text-xs text-[#991b1b] flex items-start space-x-2 font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#dc2626] mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Test Alert Dispatch (Unlocked on Success or If Verified) */}
          {verified && (
            <div className="pt-3 border-t-2 border-black space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                  <BellRing className="w-3.5 h-3.5 text-[#2563eb]" />
                  PUSH NOTIFICATIONS ACTIVE
                </span>
              </div>

              {alertSuccess && (
                <div className="p-3 rounded-xl bg-[#86efac] border-2 border-black shadow-[2px_2px_0_#000] text-xs text-[#065f46] flex items-center space-x-2 font-black animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-[#065f46]" />
                  <span>Test warning alert dispatched to your Telegram! Check your phone.</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleSendTestAlert}
                disabled={sendingAlert}
                className="w-full btn-3d-crimson py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {sendingAlert ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Transmitting Markdown Alert...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Test Liquidation Warning Alert</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[#fef08a] border-t-2 border-black flex items-center justify-between text-[11px] text-black font-mono font-bold">
          <span>Non-custodial early-warning system</span>
          <button
            type="button"
            onClick={onClose}
            className="font-black text-black hover:underline"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
