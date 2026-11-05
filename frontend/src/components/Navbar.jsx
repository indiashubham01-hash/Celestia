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
    <header className="sticky top-0 z-40 bg-[#f5e8cc]/95 backdrop-blur-md border-b-2 border-[#e8d4a8] shadow-sm">
      {/* Carnival Canopy Accent Ribbon */}
      <div className="h-1 bg-gradient-to-r from-[#4c1d95] via-[#b45309] to-[#b91c1c] w-full" />

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
            <div className="w-9 h-9 rounded-xl bg-[#4c1d95] text-[#fef3c7] flex items-center justify-center font-grand font-black text-lg border border-[#3b1575] shadow-[0_3px_0_#280c54] transition-transform active:translate-y-0.5 active:shadow-[0_1px_0_#280c54]">
              B
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-heritage font-black text-xl tracking-tight text-[#1c1812]">
                  Bachega
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono tracking-wider bg-[#b45309] text-white border border-[#924309] shadow-[0_1px_0_#78350f] rounded font-bold uppercase">
                  READ-ONLY
                </span>
              </div>
              <p className="text-[11px] text-[#443a2b] font-heritage italic hidden sm:block">
                DeFi Risk &amp; Crash Simulation Workbench
              </p>
            </div>
          </div>

          {/* Center Navigation Links - 3D Mechanical Keycaps on Dashboard */}
          {isDashboardView ? (
            <nav className="hidden md:flex items-center space-x-2 font-sans">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all ${
                  activeTab === 'dashboard'
                    ? 'keycap-tab-active'
                    : 'keycap-tab text-[#443a2b]'
                }`}
              >
                <span className="font-mono text-[10px] opacity-75">[1]</span>
                <Activity className="w-3.5 h-3.5" />
                <span>Portfolio</span>
              </button>

              <button
                onClick={() => setActiveTab('simulator')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all ${
                  activeTab === 'simulator'
                    ? 'keycap-tab-active'
                    : 'keycap-tab text-[#443a2b]'
                }`}
              >
                <span className="font-mono text-[10px] opacity-75">[2]</span>
                <Sliders className="w-3.5 h-3.5" />
                <span>Crash Simulator</span>
              </button>

              <button
                onClick={() => setActiveTab('alerts')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all ${
                  activeTab === 'alerts'
                    ? 'keycap-tab-active'
                    : 'keycap-tab text-[#443a2b]'
                }`}
              >
                <span className="font-mono text-[10px] opacity-75">[3]</span>
                <Bell className="w-3.5 h-3.5" />
                <span>Alert Preferences</span>
              </button>
            </nav>
          ) : (
            <div className="hidden md:flex items-center space-x-2 text-xs text-[#443a2b] font-mono bg-[#fdf5e6] px-3.5 py-1 rounded-full border border-[#e8d4a8] shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#15803d] animate-pulse"></span>
              <span className="font-semibold">100% Non-Custodial Simulation</span>
            </div>
          )}

          {/* Right Action Bar */}
          <div className="flex items-center space-x-2.5">
            {isDashboardView ? (
              <>
                {/* Active Monitored Wallet Pill with Network Badge */}
                {primaryWallet && (
                  <div className="hidden sm:flex items-center space-x-2 bg-[#ffffff] border border-[#e8d4a8] shadow-[0_2px_0_#d8c292] rounded-xl px-3 py-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-[#15803d] animate-pulse"></span>
                    <span className="px-1.5 py-0.5 rounded bg-[#f5e8cc] border border-[#e8d4a8] text-[#4c1d95] text-[10px] font-bold uppercase font-mono">
                      {primaryWallet.chain}
                    </span>
                    <span className="font-mono font-bold text-[#1c1812]">
                      {shortenAddress(primaryWallet.address)}
                    </span>
                  </div>
                )}

                {/* Add / Switch Wallet */}
                <button
                  onClick={onOpenWalletModal}
                  title="Track another public address"
                  className="btn-3d-gold px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Add Wallet</span>
                </button>

                {/* User Profile Pill */}
                {user && (
                  <div
                    title={user.email}
                    className="hidden lg:flex items-center space-x-1.5 bg-[#ffffff] border border-[#e8d4a8] shadow-[0_2px_0_#d8c292] rounded-xl px-3 py-1.5 text-xs text-[#443a2b]"
                  >
                    <User className="w-3.5 h-3.5 text-[#b45309]" />
                    <span className="font-mono font-medium max-w-[120px] truncate">{user.email}</span>
                  </div>
                )}

                {/* Sign Out Button */}
                <button
                  onClick={onLogOut}
                  title="Sign out of current session"
                  className="bg-[#ffffff] hover:bg-[#fee2e2] text-[#443a2b] hover:text-[#b91c1c] border border-[#e8d4a8] shadow-[0_2px_0_#d8c292] active:translate-y-0.5 active:shadow-[0_1px_0_#d8c292] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all"
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
                  className="btn-3d-royal px-4 py-2 rounded-xl text-xs font-bold tracking-wide flex items-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#fde68a]" />
                  <span>Try Live Demo</span>
                </button>

                <button
                  onClick={onOpenLoginModal}
                  className="btn-3d-gold px-4 py-2 rounded-xl text-xs font-bold tracking-wide flex items-center space-x-1.5"
                >
                  <LogIn className="w-3.5 h-3.5 text-white" />
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