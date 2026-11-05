import React from 'react';
import { Shield, Activity, Bell, Sliders, Plus, LogIn, LogOut, Sparkles, User } from 'lucide-react';

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
}) {
  const shortenAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const isDashboardView = currentView === 'dashboard';

  return (
    <header className="sticky top-0 z-40 border-b border-amber-900/15 bg-[#fcfbf7]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Product Identity */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => {
              if (isDashboardView) {
                setActiveTab('dashboard');
              }
            }}
          >
            <div className="w-9 h-9 rounded-xl bg-terracotta text-white flex items-center justify-center font-grand font-extrabold text-lg shadow-sm border border-amber-900/20">
              B
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-heritage font-extrabold text-xl tracking-tight text-slate-900">
                  Bachega
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono tracking-wider bg-amber-100 text-amber-900 border border-amber-300 rounded font-bold">
                  READ-ONLY
                </span>
              </div>
              <p className="text-[11px] text-amber-950/70 font-heritage italic hidden sm:block">
                DeFi Risk & Crash Simulation Workbench
              </p>
            </div>
          </div>

          {/* Center Navigation Links - Visible on Dashboard */}
          {isDashboardView ? (
            <nav className="hidden md:flex items-center space-x-1.5 font-sans">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-2 ${
                  activeTab === 'dashboard'
                    ? 'bg-white text-slate-900 border border-amber-900/25 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-amber-100/40'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-sage" />
                <span>Portfolio</span>
              </button>

              <button
                onClick={() => setActiveTab('simulator')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-2 ${
                  activeTab === 'simulator'
                    ? 'bg-white text-slate-900 border border-amber-900/25 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-amber-100/40'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-terracotta" />
                <span>Crash Simulator</span>
              </button>

              <button
                onClick={() => setActiveTab('alerts')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-2 ${
                  activeTab === 'alerts'
                    ? 'bg-white text-slate-900 border border-amber-900/25 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-amber-100/40'
                }`}
              >
                <Bell className="w-3.5 h-3.5 text-brass" />
                <span>Alert Preferences</span>
              </button>
            </nav>
          ) : (
            <div className="hidden md:flex items-center space-x-2 text-xs text-slate-600 font-mono">
              <span className="w-2 h-2 rounded-full bg-sage"></span>
              <span>100% Non-Custodial Simulation</span>
            </div>
          )}

          {/* Right Action Bar */}
          <div className="flex items-center space-x-2.5">
            {isDashboardView ? (
              <>
                {/* Active Monitored Wallet Pill */}
                {primaryWallet && (
                  <div className="hidden sm:flex items-center space-x-2 bg-white border border-amber-900/15 rounded-xl px-3 py-1.5 text-xs shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-sage animate-pulse"></span>
                    <span className="text-slate-500 capitalize">{primaryWallet.chain}:</span>
                    <span className="font-mono font-medium text-slate-800">
                      {shortenAddress(primaryWallet.address)}
                    </span>
                  </div>
                )}

                {/* Add / Switch Wallet */}
                <button
                  onClick={onOpenWalletModal}
                  title="Track another public address"
                  className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Add Wallet</span>
                </button>

                {/* User Profile Pill */}
                {user && (
                  <div
                    title={user.email}
                    className="hidden lg:flex items-center space-x-1.5 bg-white border border-amber-900/15 rounded-xl px-3 py-1.5 text-xs text-slate-700 shadow-sm"
                  >
                    <User className="w-3.5 h-3.5 text-amber-800" />
                    <span className="font-mono max-w-[120px] truncate">{user.email}</span>
                  </div>
                )}

                {/* Log Out Button */}
                <button
                  onClick={onLogOut}
                  title="Sign out of current session"
                  className="bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 border border-amber-900/20 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Log Out</span>
                </button>
              </>
            ) : (
              <>
                {/* Landing / Onboard Action Buttons */}
                <button
                  onClick={onTryDemo}
                  className="bg-terracotta hover:bg-terracotta-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide flex items-center space-x-1.5 transition-all shadow-terracotta"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                  <span>Try Live Demo</span>
                </button>

                <button
                  onClick={onOpenLoginModal}
                  className="bg-white hover:bg-amber-50/60 text-slate-800 border border-amber-900/25 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
                >
                  <LogIn className="w-3.5 h-3.5 text-slate-600" />
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
