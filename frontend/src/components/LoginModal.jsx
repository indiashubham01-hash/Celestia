import React, { useState } from 'react';
import { X, Mail, Sparkles, ArrowRight, Shield, Check, Loader2 } from 'lucide-react';

export default function LoginModal({ isOpen, onClose, onLoginSuccess, onTryDemo }) {
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError(null);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setOtpSent(true);
    }, 600);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      setError('Please enter the 4-digit code sent to your email (e.g. 1900).');
      return;
    }
    setError(null);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess({
        email: email.trim(),
        handle: email.split('@')[0],
        isAuthenticated: true,
      });
      onClose();
    }, 500);
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess({
        email: 'investor.google@bachega.app',
        handle: 'google_investor',
        isAuthenticated: true,
      });
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#fcfbf7] border border-amber-900/25 rounded-2xl shadow-2xl overflow-hidden paper-card">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-900/15 bg-white/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-terracotta text-white flex items-center justify-center font-grand font-bold text-base shadow-sm">
              B
            </div>
            <div>
              <h3 className="text-base font-heritage font-bold text-slate-900">Sign In to Bachega</h3>
              <p className="text-[11px] text-amber-950/70 font-heritage italic">No passwords required</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-amber-100/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Quick Demo Bypass Banner */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center space-x-1.5 text-amber-900">
                <Sparkles className="w-4 h-4 text-terracotta" />
                <span>Instant Evaluator Bypass</span>
              </span>
              <span className="text-[10px] font-mono uppercase bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                1-CLICK
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Skip typing or OTP confirmation. Jump immediately into the active Aave v3 Arbitrum risk workbench.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onTryDemo();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-terracotta hover:bg-terracotta-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-terracotta transition-all"
            >
              <span>Instant Guest / Demo Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-amber-900/15"></div>
            <span className="flex-shrink mx-3 text-[11px] font-mono text-slate-400 uppercase tracking-widest">or email sign-in</span>
            <div className="flex-grow border-t border-amber-900/15"></div>
          </div>

          {/* Email OTP Flow */}
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-mono">
                  Your Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="investor@domain.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-amber-900/20 text-slate-900 placeholder-slate-400 text-xs font-sans focus:outline-none focus:border-terracotta shadow-sm"
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs text-carmine font-medium">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending Login Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send One-Time Code</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-3.5">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900">
                Code dispatched to <strong>{email}</strong>. (Simulated code: <span className="font-mono font-bold">1900</span>)
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 font-mono">
                  Enter 4-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="e.g. 1900"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-amber-900/20 text-slate-900 text-sm font-mono text-center tracking-widest focus:outline-none focus:border-terracotta shadow-sm font-bold"
                />
              </div>

              {error && (
                <p className="text-xs text-carmine font-medium">{error}</p>
              )}

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-terracotta hover:bg-terracotta-700 text-white font-bold text-xs transition-all shadow-terracotta flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm & Sign In</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Google Sign In Option */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold flex items-center justify-center space-x-2.5 shadow-sm transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

