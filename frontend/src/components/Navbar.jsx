import React, { useState, useEffect } from 'react';
import {
  Shield,
  Activity,
  Bell,
  Sliders,
  Plus,
  LogIn,
  LogOut,
  Sparkles,
  User,
  Send,
  Bot
} from 'lucide-react';

export default function Navbar({
  currentView,
  activeTab,
  setActiveTab,
  onOpenWalletModal,
  onOpenLoginModal,
  onTryDemo,
  onLogOut,
  user,
  primaryWallet,
  onOpenTelegramModal,
}) {
  const [isTelegramVerified, setIsTelegramVerified] = useState(
    () => localStorage.getItem('bachega_telegram_verified') === 'true'
  );
  const [telegramUsername, setTelegramUsername] = useState(
    () => localStorage.getItem('bachega_telegram_username') || ''
  );

  useEffect(() => {
    const handleStorageChange = () => {
      setIsTelegramVerified(localStorage.getItem('bachega_telegram_verified') === 'true');
      setTelegramUsername(localStorage.getItem('bachega_telegram_username') || '');
    };
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(handleStorageChange, 2000);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const shortenAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const isDashboardView = currentView === 'dashboard';

  return (
    <header className="sticky top-0 z-40 bg-white border-b-2 border-black shadow-[0_2px_0_#000000]">
      {/* Neo-Brutalist Accent Top Ribbon */}
      <div className="h-1 bg-black w-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Product Identity */}
          <div
            className="flex items-center space-x-3 cursor-pointer select-none"
            onClick={() => {
              if (isDashboardView) {
                setActiveTab('dashboard');
              }
            }}
          >
            <div className="w-9 h-9 rounded-lg bg-[#3b82f6] text-white flex items-center justify-center font-black text-xl border-2 border-black shadow-[2px_2px_0_#000000] transition-transform active:translate-x-0.5 active:translate-y-0.5 active:shadow-none">
              B
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-xl tracking-tight text-black">
                  Bachega.fi
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono tracking-wider bg-[#fef08a] text-black border-2 border-black shadow-[2px_2px_0_#000000] rounded font-black uppercase">
                  READ-ONLY
                </span>
              </div>
              <p className="text-[11px] text-gray-700 font-mono font-medium hidden sm:block">
                DeFi Risk &amp; Crash Simulation Workbench
              </p>
            </div>
          </div>

          {/* Center Navigation Links - Neo-Brutalist Keycaps on Dashboard */}
          {isDashboardView ? (
            <nav className="hidden md:flex items-center space-x-2.5 font-sans">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black flex items-center space-x-2 transition-all ${
                  activeTab === 'dashboard'
                    ? 'keycap-tab-active'
                    : 'keycap-tab text-black'
                }`}
              >
                <span className="font-mono text-[10px] opacity-75">[1]</span>
                <Activity className="w-3.5 h-3.5" />
                <span>Portfolio</span>
              </button>

              <button
                onClick={() => setActiveTab('simulator')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black flex items-center space-x-2 transition-all ${
                  activeTab === 'simulator'
                    ? 'keycap-tab-active'
                    : 'keycap-tab text-black'
                }`}
              >
                <span className="font-mono text-[10px] opacity-75">[2]</span>
                <Sliders className="w-3.5 h-3.5" />
                <span>Crash Simulator</span>
              </button>

              <button
                onClick={() => setActiveTab('alerts')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black flex items-center space-x-2 transition-all ${
                  activeTab === 'alerts'
                    ? 'keycap-tab-active'
                    : 'keycap-tab text-black'
                }`}
              >
                <span className="font-mono text-[10px] opacity-75">[3]</span>
                <Bell className="w-3.5 h-3.5" />
                <span>Alert Preferences</span>
              </button>
            </nav>
          ) : (
            <div className="hidden md:flex items-center space-x-2 text-xs text-black font-mono bg-[#fef08a] px-3.5 py-1 rounded-lg border-2 border-black shadow-[2px_2px_0_#000000]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16a34a] border border-black animate-pulse"></span>
              <span className="font-black">100% Non-Custodial Simulation</span>
            </div>
          )}

          {/* Right Action Bar */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            {/* Direct Telegram Bot Connection Button (Always accessible) */}
            <button
              onClick={onOpenTelegramModal}
              title="Open or link Telegram @Bachega_bot"
              className="bg-[#229ED9] hover:bg-[#1a8dc4] text-white border-2 border-black shadow-[2px_2px_0_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none px-3 py-1.5 rounded-lg text-xs font-black flex items-center space-x-1.5 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isTelegramVerified && telegramUsername ? `@${telegramUsername}` : '@Bachega_bot'}
              </span>
              <span className="sm:hidden">Bot</span>
              {isTelegramVerified ? (
                <span className="w-2 h-2 rounded-full bg-[#86efac] border border-black animate-pulse" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-[#fef08a] border border-black" />
              )}
            </button>

            {isDashboardView ? (
              <>
                {/* Active Monitored Wallet Pill with Network Badge */}
                {primaryWallet && (
                  <div className="hidden sm:flex items-center space-x-2 bg-white border-2 border-black shadow-[2px_2px_0_#000000] rounded-lg px-3 py-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-[#16a34a]"></span>
                    <span className="px-1.5 py-0.2 rounded bg-[#fef08a] border border-black text-black text-[10px] font-black uppercase font-mono">
                      {primaryWallet.chain}
                    </span>
                    <span className="font-mono font-bold text-black">
                      {shortenAddress(primaryWallet.address)}
                    </span>
                  </div>
                )}

                {/* Add / Switch Wallet */}
                <button
                  onClick={onOpenWalletModal}
                  title="Track another public address"
                  className="btn-3d-gold px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Add Wallet</span>
                </button>

                {/* User Profile Pill */}
                {user && (
                  <div
                    title={user.email}
                    className="hidden lg:flex items-center space-x-1.5 bg-white border-2 border-black shadow-[2px_2px_0_#000000] rounded-lg px-3 py-1.5 text-xs text-black"
                  >
                    <User className="w-3.5 h-3.5 text-[#3b82f6]" />
                    <span className="font-mono font-bold max-w-[120px] truncate">
                      {user.user_metadata?.name || user.email}
                    </span>
                  </div>
                )}

                {/* Sign Out Button */}
                <button
                  onClick={onLogOut}
                  title="Sign out of current session"
                  className="bg-white hover:bg-[#fca5a5] text-black border-2 border-black shadow-[2px_2px_0_#000000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none px-3 py-1.5 rounded-lg text-xs font-black flex items-center space-x-1.5 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </>
            ) : (
              <>
                {/* Landing / Onboard Action Buttons */}
                <button
                  onClick={onTryDemo}
                  className="btn-3d-royal px-3.5 py-2 rounded-lg text-xs font-black tracking-wide flex items-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#fef08a]" />
                  <span>Try Demo</span>
                </button>

                <button
                  onClick={onOpenLoginModal}
                  className="btn-3d-gold px-3.5 py-2 rounded-lg text-xs font-black tracking-wide flex items-center space-x-1.5"
                >
                  <LogIn className="w-3.5 h-3.5 text-black" />
                  <span>Sign In</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
