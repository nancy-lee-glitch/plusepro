import React, { useState, useEffect } from 'react';
import type { AssetConfig, SignalData, SessionStats, UserProfile, BlogArticle, PageView, AuthModalMode } from './types.ts';
import { MarketRadar } from './components/MarketRadar.tsx';
import { LiveTicker, ASSETS } from './components/LiveTicker.tsx';
import { SignalEngine } from './components/SignalEngine.tsx';
import { RiskAdvisor } from './components/RiskAdvisor.tsx';
import { CryptoCheckout } from './components/CryptoCheckout.tsx';
import { AdminCenter } from './components/AdminCenter.tsx';
import { SystemFilesViewer } from './components/SystemFilesViewer.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { BlogSection } from './components/BlogSection.tsx';
import { AboutPage } from './components/AboutPage.tsx';
import { AuthModal } from './components/AuthModal.tsx';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageView>('landing');
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<BlogArticle | null>(null);

  // Trading engine states
  const [activeAsset, setActiveAsset] = useState<AssetConfig>(ASSETS[0]);
  const [currentPrice, setCurrentPrice] = useState<number>(1.08542);
  const [liveTicks, setLiveTicks] = useState<number[]>([]);
  const [credits, setCredits] = useState<number>(10);
  const [isVIP, setIsVIP] = useState<boolean>(false);
  const [onlineUsers, setOnlineUsers] = useState<number>(14);

  const [stats, setStats] = useState<SessionStats>({
    total: 0,
    wins: 0,
    losses: 0,
    winRate: 85.7,
  });

  // Check initial user authentication & VIP 30-day status from API
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const res = await fetch('/api.php?action=status');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setUser(data.user);
            setCredits(data.user.credits);
            setIsVIP(Boolean(data.user.is_vip));
          }
        }
      } catch (err) {
        // Fallback gracefully
      }
    };

    checkAuthStatus();
  }, []);

  // Fetch live heartbeat from backend
  useEffect(() => {
    const fetchHeartbeat = async () => {
      try {
        const res = await fetch('/heartbeat.php');
        if (res.ok) {
          const data = await res.json();
          if (data.online_count) {
            setOnlineUsers(data.online_count);
          }
        }
      } catch (err) {
        // Handled silently
      }
    };

    fetchHeartbeat();
    const interval = setInterval(fetchHeartbeat, 10000);
    return () => clearInterval(interval);
  }, []);

  // Handle credit deduction per signal
  const handleDeductCredit = async (): Promise<boolean> => {
    if (isVIP || (user && user.is_vip)) return true;
    if (credits <= 0) {
      setCurrentPage('pricing');
      return false;
    }
    setCredits((c) => Math.max(0, c - 1));
    return true;
  };

  const handleLogOutcome = (outcome: 'WIN' | 'LOSS', _signal: SignalData) => {
    setStats((prev) => {
      const wins = outcome === 'WIN' ? prev.wins + 1 : prev.wins;
      const losses = outcome === 'LOSS' ? prev.losses + 1 : prev.losses;
      const total = wins + losses;
      const winRate = total > 0 ? parseFloat(((wins / total) * 100).toFixed(1)) : 85.7;
      return { total, wins, losses, winRate };
    });
  };

  const handleCreditsPurchased = (added: number) => {
    setCredits((prev) => prev + added);
    if (user) {
      setUser({ ...user, credits: user.credits + added });
    }
    setCurrentPage('cockpit');
  };

  const handleVipPurchased = () => {
    setIsVIP(true);
    if (user) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);
      setUser({
        ...user,
        is_vip: true,
        vip_days_left: 30,
        vip_hours_left: 0,
        vip_seconds_left: 30 * 86400,
        vip_expires_at: expiry.toISOString(),
      });
    }
    setCurrentPage('cockpit');
  };

  const handleUserUpdated = (updatedUser: UserProfile | null) => {
    setUser(updatedUser);
    if (updatedUser) {
      setCredits(updatedUser.credits);
      setIsVIP(Boolean(updatedUser.is_vip));
    } else {
      setCredits(10);
      setIsVIP(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-slate-950 flex flex-col justify-between">
      {/* Top Floating Market Radar */}
      <MarketRadar />

      {/* Global Navigation Header */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-3.5 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Brand Identity */}
          <div
            onClick={() => setCurrentPage('landing')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm sm:text-base font-mono tracking-wider text-white">
                  PULSETRADE <span className="text-emerald-400 font-extrabold">PRO</span>
                </span>
                <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold hidden sm:inline">
                  v8.2 QUANT
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{onlineUsers} Active Traders Online</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 font-mono text-xs">
            <button
              type="button"
              onClick={() => setCurrentPage('landing')}
              className={`px-3 py-1.5 rounded-lg transition ${
                currentPage === 'landing' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage('cockpit')}
              className={`px-3 py-1.5 rounded-lg transition ${
                currentPage === 'cockpit' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Trading Cockpit
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedArticle(null);
                setCurrentPage('blog');
              }}
              className={`px-3 py-1.5 rounded-lg transition ${
                currentPage === 'blog' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Blog &amp; SEO
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage('about')}
              className={`px-3 py-1.5 rounded-lg transition ${
                currentPage === 'about' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              About &amp; Science
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage('pricing')}
              className={`px-3 py-1.5 rounded-lg transition ${
                currentPage === 'pricing' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              VIP &amp; Pricing
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage('admin')}
              className={`px-2.5 py-1.5 rounded-lg transition ${
                currentPage === 'admin' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-500 hover:text-amber-300'
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage('files')}
              className={`px-2 py-1.5 rounded-lg transition ${
                currentPage === 'files' ? 'bg-cyan-400 text-slate-950 font-bold' : 'text-slate-500 hover:text-cyan-300'
              }`}
            >
              PHP Files
            </button>
          </nav>

          {/* User Auth & Actions Controls */}
          <div className="flex items-center gap-2 font-mono">
            {user ? (
              <div className="flex items-center gap-2">
                {/* VIP 30-Day Protected Status Pill */}
                {user.is_vip ? (
                  <button
                    type="button"
                    onClick={() => setAuthModalMode('profile')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[11px] font-bold shadow-md shadow-amber-950/40 hover:bg-amber-500/30 transition"
                    title={`Strict 30-Day Window: ${user.vip_days_left}d ${user.vip_hours_left}h remaining`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span>★ VIP ({user.vip_days_left}d)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCurrentPage('pricing')}
                    className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-slate-800 transition"
                  >
                    <span>{credits} CR</span>
                    <span className="text-[10px] text-emerald-500 font-black">+</span>
                  </button>
                )}

                {/* Profile Avatar & Username */}
                <button
                  type="button"
                  onClick={() => setAuthModalMode('profile')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-slate-600 transition text-xs font-bold text-white"
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-black">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[90px] truncate">{user.username}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAuthModalMode('login')}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:text-white font-bold transition rounded-xl hover:bg-slate-900"
                >
                  Log In
                </button>

                {/* PRIMARY 'GET STARTED' BUTTON (Leads straight to registration with 10 free credits) */}
                <button
                  type="button"
                  id="btn-nav-get-started"
                  onClick={() => setAuthModalMode('register')}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-black rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
                >
                  <span>Get Started</span>
                  <span className="text-[10px] bg-slate-950/20 px-1.5 py-0.2 rounded font-bold">10 CR</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Responsive View Container */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-4 py-4">
        {/* VIEW 1: LANDING PAGE */}
        {currentPage === 'landing' && (
          <LandingPage
            user={user}
            onGetStarted={() => setAuthModalMode('register')}
            onOpenLogin={() => setAuthModalMode('login')}
            onLaunchCockpit={() => setCurrentPage('cockpit')}
            onSelectArticle={(article) => {
              setSelectedArticle(article);
              setCurrentPage('blog');
            }}
            onNavigateToPricing={() => setCurrentPage('pricing')}
            onNavigateToAbout={() => setCurrentPage('about')}
          />
        )}

        {/* VIEW 2: TRADING COCKPIT (The Mobile-First Cockpit) */}
        {currentPage === 'cockpit' && (
          <div className="max-w-xl mx-auto space-y-3.5 animate-in fade-in duration-200">
            {/* Quick Context Bar */}
            <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 font-mono text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-white">Live Execution Cockpit</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Balance:</span>
                <span className="font-black text-emerald-400 font-mono">
                  {isVIP || user?.is_vip ? 'UNLIMITED' : `${credits} CR`}
                </span>
                {!isVIP && !user?.is_vip && (
                  <button
                    type="button"
                    onClick={() => setCurrentPage('pricing')}
                    className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold hover:bg-emerald-500/30"
                  >
                    + Top-Up
                  </button>
                )}
              </div>
            </div>

            {/* Deriv WebSocket Ticker & Asset Switcher */}
            <LiveTicker
              activeAsset={activeAsset}
              onAssetChange={setActiveAsset}
              onPriceUpdate={setCurrentPrice}
              onTicksUpdate={setLiveTicks}
            />

            {/* Multi-Timeframe Algorithmic Signal Engine & Lockout Loop */}
            <SignalEngine
              activeAsset={activeAsset}
              currentPrice={currentPrice}
              credits={credits}
              isVIP={isVIP || Boolean(user?.is_vip)}
              onDeductCredit={handleDeductCredit}
              onLogOutcome={handleLogOutcome}
              stats={stats}
              ticks={liveTicks}
            />

            {/* Risk Advisor & 2% Stake Protection */}
            <RiskAdvisor />
          </div>
        )}

        {/* VIEW 3: EDUCATIONAL BLOG & SEO ACADEMY */}
        {currentPage === 'blog' && (
          <BlogSection
            selectedArticle={selectedArticle}
            onSelectArticle={setSelectedArticle}
            onGetStarted={() => setAuthModalMode('register')}
            onLaunchCockpit={() => setCurrentPage('cockpit')}
          />
        )}

        {/* VIEW 4: ABOUT & METHODOLOGY */}
        {currentPage === 'about' && (
          <AboutPage
            onGetStarted={() => setAuthModalMode('register')}
            onLaunchCockpit={() => setCurrentPage('cockpit')}
          />
        )}

        {/* VIEW 5: VIP & PRICING (Crypto Checkout & 30-Day VIP Pass) */}
        {currentPage === 'pricing' && (
          <div className="max-w-xl mx-auto space-y-4 animate-in fade-in duration-200">
            <CryptoCheckout
              onCreditsPurchased={handleCreditsPurchased}
              onVipPurchased={handleVipPurchased}
              onClose={() => setCurrentPage('cockpit')}
            />
          </div>
        )}

        {/* VIEW 6: ADMIN COMMAND CENTER */}
        {currentPage === 'admin' && (
          <div className="max-w-4xl mx-auto animate-in fade-in duration-200">
            <AdminCenter />
          </div>
        )}

        {/* VIEW 7: SYSTEM FILES VIEWER (PHP 8 + SQL Schema) */}
        {currentPage === 'files' && (
          <div className="max-w-4xl mx-auto animate-in fade-in duration-200">
            <SystemFilesViewer />
          </div>
        )}
      </main>

      {/* Global Auth Modal (Register / Login / 30-Day VIP Profile) */}
      <AuthModal
        mode={authModalMode}
        user={user}
        onClose={() => setAuthModalMode(null)}
        onUserUpdated={handleUserUpdated}
        onNavigateToCheckout={() => setCurrentPage('pricing')}
      />

      {/* Global Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-4 py-6 font-mono text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="font-bold text-white">PulseTrade Pro Citadel</span>
              <span>•</span>
              <span className="text-emerald-400">Deriv WebSocket Sync</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Zero-lag quantitative companion for ExpertOption, Deriv, PocketOption &amp; Quotex.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px]">
            <button
              type="button"
              onClick={() => setCurrentPage('landing')}
              className="hover:text-white transition"
            >
              Overview
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                setSelectedArticle(null);
                setCurrentPage('blog');
              }}
              className="hover:text-white transition"
            >
              Research Blog
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setCurrentPage('about')}
              className="hover:text-white transition"
            >
              About &amp; Methodology
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setCurrentPage('pricing')}
              className="hover:text-white transition"
            >
              VIP Access
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setCurrentPage('admin')}
              className="hover:text-amber-400 transition"
            >
              Admin
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
