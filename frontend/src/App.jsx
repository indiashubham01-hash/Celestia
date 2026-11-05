import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import LoginModal from './components/LoginModal';
import OnboardingCard from './components/OnboardingCard';
import PortfolioDashboard from './components/PortfolioDashboard';
import CrashSimulator from './components/CrashSimulator';
import AlertsPreferences from './components/AlertsPreferences';
import WalletModal from './components/WalletModal';
import DisclaimerBanner from './components/DisclaimerBanner';
import { api } from './services/api';

const DEMO_USER = {
  email: 'evaluator.demo@bachega.app',
  handle: 'evaluator_demo',
  isAuthenticated: true,
};

const DEMO_WALLET = {
  chain: 'arbitrum',
  address: '0x71C8401344445853782977E2A91D61b9a957B7E6',
  label: 'Aave V3 Arbitrum Vault',
  is_primary: true,
};

export default function App() {
  // Navigation & View state: 'landing' | 'onboard' | 'dashboard'
  const [currentView, setCurrentView] = useState('landing');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  // Authenticated user & active wallet session
  const [user, setUser] = useState(null);
  const [activeWallet, setActiveWallet] = useState(null);

  // Dashboard tab state: 'dashboard' | 'simulator' | 'alerts'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPositionForSim, setSelectedPositionForSim] = useState('pos_aave_v3_eth');

  // Backend data state
  const [wallets, setWallets] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Session Persistence Check on Initial Mount
  useEffect(() => {
    try {
      const savedUserStr = localStorage.getItem('bachega_user');
      const savedWalletStr = localStorage.getItem('bachega_wallet');

      const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
      const savedWallet = savedWalletStr ? JSON.parse(savedWalletStr) : null;

      if (savedUser && savedWallet) {
        setUser(savedUser);
        setActiveWallet(savedWallet);
        setCurrentView('dashboard');
      } else if (savedUser) {
        setUser(savedUser);
        setCurrentView('onboard');
      } else {
        setCurrentView('landing');
      }
    } catch (e) {
      console.warn('Could not read session from localStorage:', e);
      setCurrentView('landing');
    }
  }, []);

  // 2. Fetch portfolio and wallets from FastAPI backend
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [portfolioData, walletsData] = await Promise.all([
        api.getPortfolio(),
        api.getWallets(),
      ]);
      setPortfolio(portfolioData);
      setWallets(walletsData);

      // If activeWallet not yet set and backend has wallets, set primary
      if (!activeWallet && walletsData && walletsData.length > 0) {
        const primary = walletsData.find((w) => w.is_primary) || walletsData[0];
        setActiveWallet(primary);
      }
    } catch (err) {
      console.error('Failed to load portfolio data:', err);
      setError(err.message || 'Could not connect to FastAPI backend on http://127.0.0.1:8000');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 3. Instant Demo Bypass Handler
  const handleTryDemo = () => {
    setUser(DEMO_USER);
    setActiveWallet(DEMO_WALLET);
    try {
      localStorage.setItem('bachega_user', JSON.stringify(DEMO_USER));
      localStorage.setItem('bachega_wallet', JSON.stringify(DEMO_WALLET));
    } catch (e) {
      console.warn('localStorage write failed:', e);
    }
    setIsLoginModalOpen(false);
    setCurrentView('dashboard');
    setActiveTab('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 4. Successful Authentication Handler
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    try {
      localStorage.setItem('bachega_user', JSON.stringify(userData));
    } catch (e) {
      console.warn('localStorage write failed:', e);
    }
    setIsLoginModalOpen(false);

    // If a wallet is already remembered or present, go to dashboard; else proceed to onboarding
    const savedWalletStr = localStorage.getItem('bachega_wallet');
    if (savedWalletStr || activeWallet || (wallets && wallets.length > 0)) {
      setCurrentView('dashboard');
    } else {
      setCurrentView('onboard');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 5. Onboarding Completion Handler
  const handleCompleteOnboarding = async (walletData) => {
    setActiveWallet(walletData);
    try {
      localStorage.setItem('bachega_wallet', JSON.stringify(walletData));
    } catch (e) {
      console.warn('localStorage write failed:', e);
    }

    try {
      await api.addWallet(walletData);
    } catch (err) {
      console.warn('Could not register wallet with backend, continuing in local state:', err);
    }

    await loadData();
    setCurrentView('dashboard');
    setActiveTab('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 6. Log Out & State Reset Handler
  const handleLogOut = () => {
    try {
      localStorage.removeItem('bachega_user');
      localStorage.removeItem('bachega_wallet');
    } catch (e) {
      console.warn('localStorage clear failed:', e);
    }
    setUser(null);
    setActiveWallet(null);
    setCurrentView('landing');
    setActiveTab('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Additional wallet registered from dashboard
  const handleWalletAdded = (newWallet) => {
    setWallets((prev) => [newWallet, ...prev]);
    setActiveWallet(newWallet);
    try {
      localStorage.setItem('bachega_wallet', JSON.stringify(newWallet));
    } catch (e) {
      console.warn('localStorage write failed:', e);
    }
    loadData();
  };

  const handleSelectPositionForSim = (positionId) => {
    setSelectedPositionForSim(positionId);
    setActiveTab('simulator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const primaryWallet = activeWallet || wallets.find((w) => w.is_primary) || wallets[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#fdf5e6] text-[#1c1812] font-sans">
      {/* Top Navigation Bar */}
      <Navbar
        currentView={currentView}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenWalletModal={() => setIsWalletModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onTryDemo={handleTryDemo}
        onLogOut={handleLogOut}
        user={user}
        primaryWallet={primaryWallet}
      />

      {/* Main Content View Switcher */}
      <main className="flex-1">
        {/* VIEW 1: LANDING */}
        {currentView === 'landing' && (
          <HeroSection
            onSignIn={() => setIsLoginModalOpen(true)}
            onTryDemo={handleTryDemo}
          />
        )}

        {/* VIEW 2: ONBOARDING */}
        {currentView === 'onboard' && (
          <OnboardingCard
            user={user}
            onCompleteOnboarding={handleCompleteOnboarding}
            onSkipToDemo={handleTryDemo}
          />
        )}

        {/* VIEW 3: FULL DASHBOARD WORKBENCH */}
        {currentView === 'dashboard' && (
          <>
            {activeTab === 'dashboard' && (
              <PortfolioDashboard
                portfolio={portfolio}
                loading={loading}
                error={error}
                onRefresh={loadData}
                onSelectPositionForSimulation={handleSelectPositionForSim}
              />
            )}

            {activeTab === 'simulator' && (
              <CrashSimulator preselectedPositionId={selectedPositionForSim} />
            )}

            {activeTab === 'alerts' && <AlertsPreferences />}
          </>
        )}
      </main>

      {/* VIEW MODAL: Minimal Auth (Email OTP / Google / 1-Click Guest) */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onTryDemo={handleTryDemo}
      />

      {/* Wallet Management Modal (Accessible from TopBar on dashboard) */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onWalletAdded={handleWalletAdded}
      />

      {/* Persistent Disclaimer & Regulatory Banner */}
      <DisclaimerBanner />
    </div>
  );
}
