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
                Telegram Alerts Bot
              </h3>
              <p className="text-[11px] text-black/70 font-medium">
                Direct on-chain liquidation warnings
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
          <div className="p-4 rounded-xl bg-white border-2 border-black shadow-[3px_3px_0_#000] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-black uppercase tracking-wider text-black">
                STEP 1: INITIATE BOT CHAT
              </span>
              <span className="text-[10px] font-mono font-black bg-[#fef08a] text-black px-2 py-0.5 rounded border border-black shadow-[1px_1px_0_#000]">
                @{BOT_USERNAME}
              </span>
            </div>

            <p className="text-xs text-black/80 leading-relaxed font-sans font-medium">
              Tap Start or send <code className="bg-[#fee2e2] px-1.5 py-0.5 rounded font-mono font-black text-[#dc2626] border border-black/30">/start</code> in the bot chat to authorize automated notifications.
            </p>

            <a
              href={BOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full btn-3d-royal py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center space-x-2"
            >
              <span>1. Open @{BOT_USERNAME} on Telegram</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Step 2: Verification Status & Button */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-black uppercase tracking-wider text-black">
                STEP 2: CONFIRM CONNECTION
              </span>
              {chatId && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-black bg-[#86efac] text-[#065f46] border-2 border-black shadow-[1px_1px_0_#000]">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Connected: @{username}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleVerify}
              disabled={verifying}
              className="w-full btn-3d-gold py-2.5 px-4 rounded-xl font-black text-xs flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {verifying ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Checking Latest Updates...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-black" />
                  <span>Verify &amp; Link Account</span>
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

          {/* Test Alert Dispatch (Unlocked on Success) */}
          {chatId && (
            <div className="pt-3 border-t-2 border-black space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                  <BellRing className="w-3.5 h-3.5 text-[#2563eb]" />
                  VERIFIED CHAT ID: {chatId}
                </span>
              </div>

              {alertSuccess && (
                <div className="p-3 rounded-xl bg-[#86efac] border-2 border-black shadow-[2px_2px_0_#000] text-xs text-[#065f46] flex items-center space-x-2 font-black animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-[#065f46]" />
                  <span>Test warning alert dispatched to your Telegram!</span>
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
          <span>Simulation early-warning system</span>
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

