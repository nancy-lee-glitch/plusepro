import React, { useState } from 'react';
import type { PricingTier, CryptoWallet } from '../types.ts';

interface CryptoCheckoutProps {
  onCreditsPurchased: (credits: number) => void;
  onVipPurchased?: () => void;
  onClose: () => void;
}

const TIERS: PricingTier[] = [
  { id: 1, credits: 10, bonus: 0, price: 5.0, label: 'Starter Pack' },
  { id: 2, credits: 25, bonus: 5, price: 10.0, label: 'Popular (5 Free)', badge: 'MOST POPULAR' },
  { id: 3, credits: 60, bonus: 20, price: 20.0, label: 'Pro Trader (+20)' },
  { id: 4, credits: 150, bonus: 60, price: 45.0, label: 'Whale Alpha (+60)' },
  { id: 5, credits: 9999, bonus: 0, price: 49.0, label: '★ 30-Day VIP Pass', badge: '30-DAY LIMIT' },
];

const WALLETS: CryptoWallet[] = [
  {
    id: 1,
    coinName: 'USDT (TRC20)',
    symbol: 'USDT',
    network: 'TRON / TRC-20',
    address: 'TYDzsxdUKGptqTxb3g58FjBvh3y8kK5n2o',
    active: true,
  },
  {
    id: 2,
    coinName: 'Bitcoin',
    symbol: 'BTC',
    network: 'Bitcoin Native SegWit',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    active: true,
  },
  {
    id: 3,
    coinName: 'Ethereum',
    symbol: 'ETH',
    network: 'Ethereum (ERC-20)',
    address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    active: true,
  },
];

export function CryptoCheckout({ onCreditsPurchased, onVipPurchased, onClose }: CryptoCheckoutProps) {
  const [selectedTier, setSelectedTier] = useState<PricingTier>(TIERS[1]);
  const [selectedWallet, setSelectedWallet] = useState<CryptoWallet>(WALLETS[0]);
  const [copied, setCopied] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string>('');
  const [paymentSubmitted, setPaymentSubmitted] = useState<boolean>(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(selectedWallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txHash.trim()) return;
    setPaymentSubmitted(true);
    // Instant allocation simulation
    setTimeout(() => {
      if (selectedTier.id === 5 && onVipPurchased) {
        onVipPurchased();
      } else {
        onCreditsPurchased(selectedTier.credits + selectedTier.bonus);
      }
    }, 1500);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5 font-mono">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Top-Up Trading Signals</h3>
            <span className="text-[10px] text-slate-400">NowPayments API + Cold Storage Fallback</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Select Credit Tier */}
      <div className="space-y-2">
        <label className="text-[11px] text-slate-400 uppercase tracking-wider block">
          1. Select Credit Tier
        </label>
        <div className="grid grid-cols-2 gap-2" id="credit-tier-grid">
          {TIERS.map((tier) => {
            const isSelected = tier.id === selectedTier.id;
            return (
              <button
                key={tier.id}
                type="button"
                id={`tier-card-${tier.id}`}
                onClick={() => setSelectedTier(tier)}
                className={`p-3 rounded-xl text-left border transition relative ${
                  isSelected
                    ? 'bg-slate-950 border-emerald-500 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                {tier.badge && (
                  <span className="absolute top-2 right-2 text-[8px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-black tracking-wider">
                    {tier.badge}
                  </span>
                )}
                <span className="text-xs text-slate-300 block font-bold">{tier.label}</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-lg font-black text-white">${tier.price.toFixed(2)}</span>
                  <span className="text-[10px] text-slate-500 font-mono">USD</span>
                </div>
                <div className="text-[10px] text-emerald-400 mt-1 font-mono">
                  {tier.credits + tier.bonus} Total Signals
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Select Crypto Network */}
      <div className="space-y-2">
        <label className="text-[11px] text-slate-400 uppercase tracking-wider block">
          2. Deposit Wallet & Network
        </label>
        <div className="grid grid-cols-3 gap-2">
          {WALLETS.map((w) => {
            const isSelected = w.id === selectedWallet.id;
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => setSelectedWallet(w)}
                className={`p-2 rounded-xl text-center border transition ${
                  isSelected
                    ? 'bg-slate-950 border-cyan-500 text-cyan-300 font-bold'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-black">{w.symbol}</div>
                <div className="text-[9px] text-slate-400 mt-0.5">{w.coinName}</div>
              </button>
            );
          })}
        </div>

        {/* Wallet Address Card */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>Send EXACTLY: <strong className="text-white">${selectedTier.price.toFixed(2)} USD</strong></span>
            <span className="text-cyan-400 font-bold">{selectedWallet.network}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2.5 text-[10px] text-slate-300 font-mono break-all flex-1 select-all">
              {selectedWallet.address}
            </div>
            <button
              type="button"
              onClick={copyAddress}
              className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold border border-slate-700 transition flex items-center gap-1 shrink-0"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      {/* Payment Confirmation Form */}
      {!paymentSubmitted ? (
        <form onSubmit={handleSubmitProof} className="space-y-3 pt-1 border-t border-slate-800">
          <div>
            <label htmlFor="tx-hash-input" className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
              Transaction ID / TX Hash (Optional Proof)
            </label>
            <input
              type="text"
              id="tx-hash-input"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="e.g. 0x4f3c... or paste transfer reference"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            id="btn-confirm-crypto-deposit"
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-lg shadow-emerald-500/20"
          >
            Confirm ${selectedTier.price.toFixed(2)} Payment & Unlock {selectedTier.credits + selectedTier.bonus} Signals
          </button>
        </form>
      ) : (
        <div className="bg-emerald-950/80 border border-emerald-500/40 rounded-xl p-4 text-center space-y-2 animate-in fade-in">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="text-xs font-bold text-emerald-300">Payment Proof Dispatched</div>
          <div className="text-[11px] text-slate-400">
            Allocating {selectedTier.credits + selectedTier.bonus} Signals to your account...
          </div>
        </div>
      )}

      {/* Direct Link to PHP backend checkout */}
      <div className="text-center pt-1 border-t border-slate-800/80">
        <a
          href="/create_payment.php"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-slate-400 hover:text-emerald-400 transition underline underline-offset-2 inline-flex items-center gap-1"
        >
          <span>Open Standalone Native PHP Checkout (`create_payment.php`)</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}
