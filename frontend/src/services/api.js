/**
 * Bachega API Service Layer
 * Connects React frontend seamlessly to the FastAPI backend.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorDetail = 'API Request Failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // 1. User & Onboarding
  getProfile: () => request('/api/me'),

  // Auth (OTP & Google)
  sendOtp: (email) =>
    request('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  verifyOtp: (email, code) =>
    request('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    }),
  googleAuth: (data) =>
    request('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // 2. Wallets
  getWallets: () => request('/api/wallets'),
  addWallet: (data) =>
    request('/api/wallets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteWallet: (walletId) =>
    request(`/api/wallets/${walletId}`, {
      method: 'DELETE',
    }),

  // 3. Portfolio & Positions
  getPortfolio: () => request('/api/portfolio'),
  getPositions: () => request('/api/positions'),
  getPositionDetail: (positionId) => request(`/api/positions/${positionId}`),

  // 4. Stress Test Crash Simulations
  runSimulation: (payload) =>
    request('/api/simulations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // 5. Alerts & Verification
  getAlertPreferences: () => request('/api/alerts/preferences'),
  updateAlertPreferences: (data) =>
    request('/api/alerts/preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  linkChannel: (data) =>
    request('/api/alerts/link-channel', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // 6. Telegram Bot Integration
  verifyTelegram: () =>
    request('/api/alerts/telegram/verify', {
      method: 'POST',
    }),
  getTelegramStatus: (userId) =>
    request(`/api/alerts/telegram/status${userId ? `?user_id=${encodeURIComponent(userId)}` : ''}`),
  registerTelegramChat: (data) =>
    request('/api/alerts/telegram/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  sendTelegramAlert: (data) =>
    request('/api/alerts/telegram/send-alert', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

