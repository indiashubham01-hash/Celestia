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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white border-2 border-black shadow-[6px_6px_0_#000] rounded-2xl overflow-hidden">
        {/* Top Solid Black Ribbon */}
        <div className="h-2 bg-black w-full" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-[#fef08a]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#3b82f6] text-white flex items-center justify-center font-black text-sm border-2 border-black shadow-[1px_1px_0_#000]">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black text-black">Track Public Wallet</h3>
              <p className="text-xs text-black/70 font-medium">Read-only risk indexer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-black hover:bg-black/10 p-1.5 rounded-lg transition-colors border border-black/20"
          >
            <X className="w-5 h-5 text-black" />
          </button>
        </div>

        {/* Content / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Security Notice */}
          <div className="p-3.5 rounded-xl bg-[#86efac]/30 border-2 border-black shadow-[2px_2px_0_#000] text-xs text-black flex items-start space-x-2.5 font-medium">
            <Shield className="w-4 h-4 text-[#065f46] mt-0.5 shrink-0" />
            <div>
              <strong className="text-black font-black">100% Read-Only Safety:</strong> We only track public blockchain state to compute Health Factors. Never enter seed phrases or private keys.
            </div>
          </div>

          {/* Network Selection */}
          <div>
            <label className="block text-xs font-black text-black uppercase tracking-wider mb-2 font-mono">
              Blockchain Network
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SUPPORTED_CHAINS.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setChain(c.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-black border-2 border-black flex items-center justify-center space-x-1.5 transition-all ${
                    chain === c.id
                      ? 'bg-[#3b82f6] text-white shadow-[3px_3px_0_#000]'
                      : 'bg-white text-black shadow-[2px_2px_0_#000] hover:bg-[#fef08a] active:translate-x-[1px] active:translate-y-[1px]'
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
            <label className="block text-xs font-black text-black uppercase tracking-wider mb-2 font-mono">
              Public Address ({chain === 'solana' ? 'Base58' : '0x...'})
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={chain === 'solana' ? 'e.g. 7xKXtg2CW87d97TXJSDpb...' : 'e.g. 0x71C8401344445853782977E2A91D61b9a957B7E6'}
              className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0_#000] text-black text-sm font-mono font-bold focus:outline-none focus:shadow-[4px_4px_0_#000]"
            />
          </div>

          {/* Friendly Label */}
          <div>
            <label className="block text-xs font-black text-black uppercase tracking-wider mb-2 font-mono">
              Wallet Label / Nickname
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Aave Borrowing Vault"
              className="w-full px-4 py-2.5 rounded-xl bg-white border-2 border-black shadow-[2px_2px_0_#000] text-black text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0_#000]"
            />
          </div>

          {/* Primary toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_primary"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="w-4 h-4 rounded border-2 border-black text-[#16a34a] focus:ring-[#86efac] accent-[#16a34a]"
            />
            <label htmlFor="is_primary" className="text-xs text-black font-bold">
              Set as primary monitored wallet for dashboard overview
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-[#fee2e2] border-2 border-black shadow-[2px_2px_0_#000] text-xs text-[#991515] flex items-center space-x-2 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#dc2626]" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-black text-black hover:bg-black/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-3d-royal px-5 py-2.5 rounded-xl text-xs font-black disabled:opacity-50 flex items-center space-x-1.5"
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