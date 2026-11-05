import React, { useState } from 'react';
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
const BOT_URL = `https://t.me/${BOT_USERNAME}`;

export default function TelegramModal({
  isOpen,
  onClose,
  onTelegramVerified,
  initialChatId,
  initialUsername
}) {
  const [chatId, setChatId] = useState(initialChatId || localStorage.getItem('bachega_telegram_chat_id') || '');
  const [username, setUsername] = useState(initialUsername || localStorage.getItem('bachega_telegram_username') || '');
  const [verifying, setVerifying] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);
  const [error, setError] = useState(null);
  const [alertSuccess, setAlertSuccess] = useState(false);

  if (!isOpen) return null;

  const handleVerify = async () => {
    setVerifying(true);
    setError(null);
    setAlertSuccess(false);

    try {
      const res = await api.verifyTelegram();
      if (res.success && res.chat_id) {
        setChatId(res.chat_id);
        const resolvedUser = res.username || 'Borrower';
        setUsername(resolvedUser);
        localStorage.setItem('bachega_telegram_chat_id', res.chat_id);
        localStorage.setItem('bachega_telegram_username', resolvedUser);

        if (onTelegramVerified) {
          onTelegramVerified({
            chat_id: res.chat_id,
            username: resolvedUser,
          });
        }
      } else {
        setError(res.message || 'No chat found. Please open @Bachega_bot and send /start first.');
      }
    } catch (err) {
      setError(err.message || 'Failed to verify with Telegram API. Ensure the backend is reachable.');
    } finally {
      setVerifying(false);
    }
  };

  const handleSendTestAlert = async () => {
    if (!chatId) {
      setError('Please verify your Telegram chat before dispatching test alerts.');
      return;
    }

    setSendingAlert(true);
    setError(null);
    setAlertSuccess(false);

    try {
      const res = await api.sendTelegramAlert({
        chat_id: String(chatId),
        health_factor: 1.048,
        shock_pct: 25.0,
      });

      if (res.success) {
        setAlertSuccess(true);
        setTimeout(() => setAlertSuccess(false), 5000);
      } else {
        setError(res.message || 'Failed to send test alert.');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with alert server.');
    } finally {
      setSendingAlert(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#fdf5e6] border-2 border-[#e8d4a8] shadow-[0_12px_40px_rgba(76,29,149,0.2)] rounded-2xl overflow-hidden">
        {/* Top Canopy Ribbon */}
        <div className="h-1.5 bg-gradient-to-r from-[#4c1d95] via-[#b45309] to-[#b91c1c] w-full" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8d4a8] bg-[#f5e8cc]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4c1d95] text-white flex items-center justify-center font-bold text-sm shadow-[0_2px_0_#280c54]">
              <Bot className="w-4 h-4 text-[#fef3c7]" />
            </div>
            <div>
              <h3 className="text-base font-heritage font-black text-[#1c1812]">
                Telegram Alerts Bot
              </h3>
              <p className="text-[11px] text-[#443a2b] font-heritage italic">
                Direct on-chain liquidation warnings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#786e5e] hover:text-[#1c1812] p-1.5 rounded-lg hover:bg-white/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Step 1: Open Bot on Telegram */}
          <div className="p-4 rounded-xl bg-[#f5e8cc] border border-[#e8d4a8] shadow-[0_2px_0_#d8c292] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#b45309]">
                STEP 1: INITIATE BOT CHAT
              </span>
              <span className="text-[10px] font-mono font-bold bg-white text-[#4c1d95] px-2 py-0.5 rounded border border-[#e8d4a8]">
                @{BOT_USERNAME}
              </span>
            </div>

            <p className="text-xs text-[#443a2b] leading-relaxed font-sans">
              Tap Start or send <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-[#b91c1c]">/start</code> in the bot chat to authorize automated notifications.
            </p>

            <a
              href={BOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full btn-3d-royal py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2"
            >
              <span>1. Open @{BOT_USERNAME} on Telegram (t.me/{BOT_USERNAME})</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Step 2: Verification Status & Button */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#b45309]">
                STEP 2: CONFIRM CONNECTION
              </span>
              {chatId && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#dcfce7] text-[#166534] border border-[#86efac]">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Connected: @{username}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleVerify}
              disabled={verifying}
              className="w-full btn-3d-gold py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Checking Latest Updates...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-[#fde68a]" />
                  <span>Verify &amp; Link Account</span>
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-[#fee2e2] border border-[#fca5a5] text-xs text-[#991515] flex items-start space-x-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 text-[#b91c1c] mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Test Alert Dispatch (Unlocked on Success) */}
          {chatId && (
            <div className="pt-3 border-t border-[#e8d4a8] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#4c1d95] flex items-center gap-1.5">
                  <BellRing className="w-3.5 h-3.5 text-[#4c1d95]" />
                  VERIFIED CHAT ID: {chatId}
                </span>
              </div>

              {alertSuccess && (
                <div className="p-3 rounded-xl bg-[#dcfce7] border border-[#86efac] text-xs text-[#166534] flex items-center space-x-2 font-bold animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-[#15803d]" />
                  <span>Test warning alert dispatched to your Telegram!</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleSendTestAlert}
                disabled={sendingAlert}
                className="w-full btn-3d-crimson py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 disabled:opacity-50"
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
        <div className="px-6 py-3 bg-[#f5e8cc] border-t border-[#e8d4a8] flex items-center justify-between text-[11px] text-[#786e5e] font-mono">
          <span>Simulation early-warning system</span>
          <button
            type="button"
            onClick={onClose}
            className="font-bold text-[#1c1812] hover:underline"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

