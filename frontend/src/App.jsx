import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import AuthModal from './components/AuthModal';
import OnboardingCard from './components/OnboardingCard';
import PortfolioDashboard from './components/PortfolioDashboard';
import CrashSimulator from './components/CrashSimulator';
import AlertsPreferences from './components/AlertsPreferences';
import WalletModal from './components/WalletModal';
import TelegramModal from './components/TelegramModal';
import DisclaimerBanner from './components/DisclaimerBanner';
import { supabase } from './lib/supabase';
import { api } from './services/api';

const DEMO_USER = {
  id: 'usr_pitch_demo',
  email: 'evaluator.demo@bachega.app',
  user_metadata: { name: 'Pitch Evaluator' },
  isAuthenticated: true,
};

const DEMO_WALLET = {
  chain: 'arbitrum',
  address: '0x71C8401344445853782977E2A91D61b9a957B7E6',
  label: 'Aave V3 Arbitrum Vault',
  is_primary: true,
};

export default function App() {
  // 3 Visual States: 'landing' (default) | 'onboard' | 'dashboard'
  const [currentView, setCurrentView] = useState('landing');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);

  // Authenticated user & active wallet session
  const [user, setUser] = useState(null);
  const [activeWallet, setActiveWallet] = useState(null);

  // Registered custom position metrics (collateral & debt configured at registration)
  const [customPosition, setCustomPosition] = useState(() => {
    try {
      const saved = localStorage.getItem('bachega_position');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Dashboard tab state: 'dashboard' | 'simulator' | 'alerts'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPositionForSim, setSelectedPositionForSim] = useState('pos_aave_v3_eth');

  // Backend data state
  const [wallets, setWallets] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Session State & Persistence with Supabase + localStorage
  useEffect(() => {
    // A. Check localStorage cache first for fast synchronous render
    let cachedUser = null;
    let cachedWallet = null;
    try {
      const savedUserStr = localStorage.getItem('bachega_user');
      const savedWalletStr = localStorage.getItem('bachega_wallet');
      cachedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
      cachedWallet = savedWalletStr ? JSON.parse(savedWalletStr) : null;

      if (cachedUser) {
        setUser(cachedUser);
        const cleanEmail = cachedUser.email?.toLowerCase().trim();
        const hasOnboarded = localStorage.getItem(`bachega_onboarded_${cleanEmail}`) === 'true';

        if (hasOnboarded && (cachedWallet || customPosition)) {
          if (cachedWallet) setActiveWallet(cachedWallet);
          setCurrentView('dashboard');
        } else {
          setCurrentView('onboard');
        }
      } else {
        setCurrentView('landing');
      }
    } catch (e) {
      console.warn('Could not read cached session:', e);
    }

    // B. Check Supabase Auth Session asynchronously
    supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (sessionError) {
        console.warn('Supabase getSession error:', sessionError.message);
        return;
      }

      if (session?.user) {
        const supaUser = {
          id: session.user.id,
          email: session.user.email,
          user_metadata: session.user.user_metadata || {},
          isAuthenticated: true,
        };
        setUser(supaUser);
        try {
          localStorage.setItem('bachega_user', JSON.stringify(supaUser));
        } catch (e) {}

        const cleanEmail = supaUser.email?.toLowerCase().trim();
        const hasOnboarded = localStorage.getItem(`bachega_onboarded_${cleanEmail}`) === 'true';
        const savedWalletStr = localStorage.getItem('bachega_wallet');

        if (hasOnboarded && (savedWalletStr || cachedWallet || customPosition)) {
          setCurrentView('dashboard');
        } else {
          setCurrentView('onboard');
        }
      }
    });

    // C. Subscribe to live Supabase Auth State changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const supaUser = {
          id: session.user.id,
          email: session.user.email,
          user_metadata: session.user.user_metadata || {},
          isAuthenticated: true,
        };
        setUser(supaUser);
        try {
          localStorage.setItem('bachega_user', JSON.stringify(supaUser));
        } catch (e) {}

        const cleanEmail = supaUser.email?.toLowerCase().trim();
        const hasOnboarded = localStorage.getItem(`bachega_onboarded_${cleanEmail}`) === 'true';
        const savedWallet = localStorage.getItem('bachega_wallet');

        if (hasOnboarded && (savedWallet || customPosition)) {
          setCurrentView('dashboard');
        } else {
          setCurrentView('onboard');
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setActiveWallet(null);
        setCustomPosition(null);
        try {
          localStorage.removeItem('bachega_user');
          localStorage.removeItem('bachega_wallet');
          localStorage.removeItem('bachega_position');
          localStorage.removeItem('bachega_telegram_chat_id');
          localStorage.removeItem('bachega_telegram_username');
          localStorage.removeItem('bachega_telegram_verified');
          localStorage.removeItem('bachega_telegram_enabled');
        } catch (e) {}
        setCurrentView('landing');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // 2. Fetch portfolio and wallets from backend API
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
      localStorage.setItem(`bachega_onboarded_${DEMO_USER.email.toLowerCase()}`, 'true');
    } catch (e) {
      console.warn('localStorage write failed:', e);
    }
    setIsAuthModalOpen(false);
    setCurrentView('dashboard');
    setActiveTab('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 4. Successful Authentication Handler (from AuthModal)
  const handleAuthSuccess = (userData, isNewRegistration = false, userPosition = null) => {
    const cleanEmail = userData.email?.toLowerCase().trim();
    const formattedUser = {
      id: userData.id || 'usr_' + Date.now(),
      email: cleanEmail,
      user_metadata: userData.user_metadata || {},
      isAuthenticated: true,
    };
    setUser(formattedUser);
    try {
      localStorage.setItem('bachega_user', JSON.stringify(formattedUser));
    } catch (e) {
      console.warn('localStorage write failed:', e);
    }

    if (userPosition) {
      setCustomPosition(userPosition);
      try {
        localStorage.setItem('bachega_position', JSON.stringify(userPosition));
        localStorage.setItem(`bachega_onboarded_${cleanEmail}`, 'true');
      } catch (e) {}
    }

    setIsAuthModalOpen(false);

    if (userPosition) {
      setCurrentView('dashboard');
      setActiveTab('dashboard');
    } else {
      const hasCompletedOnboard = !isNewRegistration && (localStorage.getItem(`bachega_onboarded_${cleanEmail}`) === 'true');
      if (hasCompletedOnboard) {
        setCurrentView('dashboard');
      } else {
        setCurrentView('onboard');
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 5. Onboarding Completion Handler
  const handleCompleteOnboarding = async (walletData) => {
    setActiveWallet(walletData);
    const cleanEmail = user?.email?.toLowerCase().trim();

    if (walletData.userPosition) {
      setCustomPosition(walletData.userPosition);
      try {
        localStorage.setItem('bachega_position', JSON.stringify(walletData.userPosition));
      } catch (e) {}
    }

    try {
      localStorage.setItem('bachega_wallet', JSON.stringify(walletData));
      if (cleanEmail) {
        localStorage.setItem(`bachega_onboarded_${cleanEmail}`, 'true');
      }
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

  // 6. Sign Out Handler
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase signOut notice:', err);
    }
    try {
      localStorage.removeItem('bachega_user');
      localStorage.removeItem('bachega_wallet');
      localStorage.removeItem('bachega_position');
      localStorage.removeItem('bachega_telegram_chat_id');
      localStorage.removeItem('bachega_telegram_username');
      localStorage.removeItem('bachega_telegram_verified');
      localStorage.removeItem('bachega_telegram_enabled');
    } catch (e) {
      console.warn('localStorage clear failed:', e);
    }
    setUser(null);
    setActiveWallet(null);
    setCustomPosition(null);
    setCurrentView('landing');
    setActiveTab('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
    <div className="min-h-screen flex flex-col bg-[#fffdf5] text-black font-sans selection:bg-[#fef08a] selection:text-black">
      {/* Top Navigation Bar with active wallet, network badge, and Sign Out */}
      <Navbar
        currentView={currentView}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenWalletModal={() => setIsWalletModalOpen(true)}
        onOpenLoginModal={() => setIsAuthModalOpen(true)}
        onTryDemo={handleTryDemo}
        onLogOut={handleSignOut}
        user={user}
        primaryWallet={primaryWallet}
        onOpenTelegramModal={() => setIsTelegramModalOpen(true)}
      />

      {/* Main Screen Navigation */}
      <main className="flex-1">
        {/* VIEW 1: LANDING (Default) */}
        {currentView === 'landing' && (
          <HeroSection
            onSignIn={() => setIsAuthModalOpen(true)}
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
                onOpenTelegramModal={() => setIsTelegramModalOpen(true)}
                customPosition={customPosition}
                onUpdateCustomPosition={(newPos) => {
                  setCustomPosition(newPos);
                  try {
                    localStorage.setItem('bachega_position', JSON.stringify(newPos));
                  } catch (e) {}
                }}
              />
            )}

            {activeTab === 'simulator' && (
              <CrashSimulator preselectedPositionId={selectedPositionForSim} />
            )}

            {activeTab === 'alerts' && <AlertsPreferences />}
          </>
        )}
      </main>

      {/* VIEW MODAL: Two-Step Supabase Email OTP + 1-Click Demo */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        onTryDemo={handleTryDemo}
      />

      {/* Wallet Management Modal */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onWalletAdded={handleWalletAdded}
      />

      {/* Global Interactive Telegram Alerts & Chatbot Modal */}
      <TelegramModal
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
        currentUser={user}
        onTelegramVerified={(data) => {
          console.log('Telegram bot verified:', data);
        }}
      />

      {/* Persistent Regulatory & Risk Disclaimer ("Simulation, not prediction.") */}
      <DisclaimerBanner />
    </div>
  );
}
