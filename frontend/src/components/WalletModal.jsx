import React, { useState } from 'react';
import { X, Shield, AlertCircle, Check, Loader2 } from 'lucide-react';
import { api } from '../services/api';

const SUPPORTED_CHAINS = [
  { id: 'ethereum', name: 'Ethereum', icon: '⟠' },
  { id: 'arbitrum', name: 'Arbitrum', icon: '🔵' },
  { id: 'optimism', name: 'Optimism', icon: '🔴' },
  { id: 'polygon', name: 'Polygon', icon: '💜' },
  { id: 'base', name: 'Base', icon: '🔷' },
  { id: 'solana', name: 'Solana', icon: '☀️' },
];

export default function WalletModal({ isOpen, onClose, onWalletAdded }) {
  const [chain, setChain] = useState('ethereum');
  const [address, setAddress] = useState('');
  const [label, setLabel] = useState('Personal Ledger');
  const [isPrimary, setIsPrimary] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanAddress = address.trim();
    if (!cleanAddress) {
      setError('Please enter a public wallet address.');
      return;
    }

    if (chain !== 'solana' && !/^0x[a-fA-F0-9]{40}$/.test(cleanAddress)) {
      setError('Invalid EVM address format. Must be 42 characters starting with 0x.');
      return;
    }

    try {
      setLoading(true);
      const newWallet = await api.addWallet({
        chain,
        address: cleanAddress,
        label: label.trim() || 'Monitored Address',
        is_primary: isPrimary,
      });
      onWalletAdded(newWallet);
      onClose();
      setAddress('');
    } catch (err) {
      setError(err.message || 'Failed to add wallet. Please check address and network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#fdf5e6] border-2 border-[#e8d4a8] border-b-4 border-[#d8c292] rounded-2xl shadow-2xl overflow-hidden">
        {/* Top Canopy Ribbon */}
        <div className="h-1 bg-gradient-to-r from-[#4c1d95] via-[#b45309] to-[#b91c1c] w-full" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8d4a8] bg-[#f5e8cc]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4c1d95] text-[#fef3c7] flex items-center justify-center font-grand font-black text-sm border border-[#3b1575] border-b-3 border-[#280c54] shadow-sm">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-heritage font-black text-[#1c1812]">Track Public Wallet</h3>
              <p className="text-xs text-[#443a2b] font-heritage italic">Read-only risk indexer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#786e5e] hover:text-[#1c1812] p-1.5 rounded-lg hover:bg-white/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Security Notice */}
          <div className="p-3.5 rounded-xl bg-[#f5e8cc] border border-[#e8d4a8] border-b-2 border-[#d8c292] text-xs text-[#1c1812] flex items-start space-x-2.5">
            <Shield className="w-4 h-4 text-[#4c1d95] mt-0.5 shrink-0" />
            <div>
              <strong className="text-[#4c1d95]">100% Read-Only Safety:</strong> We only track public blockchain state to compute Health Factors. Never enter seed phrases or private keys.
            </div>
          </div>

          {/* Network Selection */}
          <div>
            <label className="block text-xs font-semibold text-[#1c1812] uppercase tracking-wider mb-2 font-mono">
              Blockchain Network
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SUPPORTED_CHAINS.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setChain(c.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center justify-center space-x-1.5 transition-all ${
                    chain === c.id
                      ? 'bg-[#4c1d95] text-white border-[#3b1575] border-b-3 border-[#280c54] font-bold shadow-sm'
                      : 'bg-white border-[#e8d4a8] border-b-2 border-[#d8c292] text-[#443a2b] hover:bg-[#fef3c7]/50'
                  }`}
                >
                  <span>{c.icon}</span>
                  <span className="capitalize">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Public Address Input */}
          <div>
            <label className="block text-xs font-semibold text-[#1c1812] uppercase tracking-wider mb-2 font-mono">
              Public Address ({chain === 'solana' ? 'Base58' : '0x...'})
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={chain === 'solana' ? 'e.g. 7xKXtg2CW87d97TXJSDpb...' : 'e.g. 0x71C8401344445853782977E2A91D61b9a957B7E6'}
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#e8d4a8] text-[#1c1812] placeholder-[#786e5e]/50 text-sm font-mono focus:outline-none focus:border-[#4c1d95] transition-colors shadow-sm"
            />
          </div>

          {/* Friendly Label */}
          <div>
            <label className="block text-xs font-semibold text-[#1c1812] uppercase tracking-wider mb-2 font-mono">
              Wallet Label / Nickname
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Aave Borrowing Vault"
              className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#e8d4a8] text-[#1c1812] placeholder-[#786e5e]/50 text-sm focus:outline-none focus:border-[#4c1d95] transition-colors shadow-sm"
            />
          </div>

          {/* Primary toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_primary"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="rounded border-[#e8d4a8] text-[#4c1d95] focus:ring-[#4c1d95]"
            />
            <label htmlFor="is_primary" className="text-xs text-[#443a2b]">
              Set as primary monitored wallet for dashboard overview
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-[#fee2e2] border border-[#fca5a5] text-xs text-[#991515] flex items-center space-x-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#b91c1c]" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#786e5e] hover:text-[#1c1812] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-3d-royal px-5 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50 flex items-center space-x-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Indexing Address...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Start Monitoring</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}