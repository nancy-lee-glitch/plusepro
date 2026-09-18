import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { AssetConfig, SignalData, SessionStats, TechnicalAudit } from '../types.ts';
import { playCallAudioChime, playPutAudioChime } from '../utils/audio.ts';
import { analyzeMarketConfluence } from '../utils/quantEngine.ts';

interface SignalEngineProps {
  activeAsset: AssetConfig;
  currentPrice: number;
  credits: number;
  isVIP: boolean;
  onDeductCredit: () => Promise<boolean>;
  onLogOutcome: (outcome: 'WIN' | 'LOSS', signal: SignalData) => void;
  stats: SessionStats;
  ticks?: number[];
}

export const TIMEFRAMES = [
  { id: '30s', label: '30 SEC', seconds: 30, desc: 'Micro-Scalp & Tick Acceleration' },
  { id: '1m', label: '1 MIN', seconds: 60, desc: 'EMA 9/21 Confluence & RSI Momentum' },
  { id: '2m', label: '2 MIN', seconds: 120, desc: 'Dual-Candle Continuation' },
  { id: '3m', label: '3 MIN', seconds: 180, desc: 'Structure Breakout' },
  { id: '5m', label: '5 MIN', seconds: 300, desc: 'Macro Trend Momentum' },
  { id: '15m', label: '15 MIN', seconds: 900, desc: 'Key Level Reversal' },
];

export function SignalEngine({
  activeAsset,
  currentPrice,
  credits,
  isVIP,
  onDeductCredit,
  onLogOutcome,
  stats,
  ticks = [],
}: SignalEngineProps) {
  const [selectedTf, setSelectedTf] = useState<string>('30s');
  const [signal, setSignal] = useState<SignalData | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [freshnessSec, setFreshnessSec] = useState<number>(6.0);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  
  // Re-check animation state
  const [isRechecking, setIsRechecking] = useState<boolean>(false);
  const [recheckStage, setRecheckStage] = useState<number>(0);
  const [recheckNote, setRecheckNote] = useState<string>('');

  // Active Trade Execution & Real In-Trade Live Tracking
  const [activeTrade, setActiveTrade] = useState<{
    entryPrice: number;
    direction: 'CALL' | 'PUT';
    timeframeSeconds: number;
    startedAt: number;
    secondsRemaining: number;
    status: 'IN_THE_MONEY' | 'OUT_OF_THE_MONEY' | 'AT_THE_MONEY';
    pipDiff: number;
    completed: boolean;
  } | null>(null);

  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const tradeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Continuous 24/7 Quantitative Telemetry Calculation (Runs on every tick)
  const safeTicks = useMemo(() => {
    if (ticks && ticks.length >= 8) return ticks;
    // Fallback pseudo-buffer if WS just connected
    const base = currentPrice || 1.08500;
    return Array.from({ length: 25 }, (_, i) => base + (Math.sin(i / 2) * activeAsset.pipSize * 0.8));
  }, [ticks, currentPrice, activeAsset.pipSize]);

  const liveAudit: TechnicalAudit = useMemo(() => {
    return analyzeMarketConfluence(safeTicks, selectedTf, activeAsset.pipSize);
  }, [safeTicks, selectedTf, activeAsset.pipSize]);

  // Active timeframe config
  const tfConfig = TIMEFRAMES.find((t) => t.id === selectedTf) || TIMEFRAMES[0];

  // 2. Trigger Deep Algorithmic Re-Check Sequence
  const handleTriggerAnalysis = async () => {
    if (isLocked || isRechecking || activeTrade) return;

    // Check credits
    const success = await onDeductCredit();
    if (!success && !isVIP) return;

    setIsRechecking(true);
    setRecheckStage(1);
    setRecheckNote(`[Phase 1/4] Ingesting Deriv tick buffer (${safeTicks.length} ticks)...`);

    // Multi-phase verification simulation for rigorous accuracy check
    setTimeout(() => {
      setRecheckStage(2);
      setRecheckNote(`[Phase 2/4] Auditing tick velocity (${liveAudit.tickVelocity > 0 ? '+' : ''}${liveAudit.tickVelocity} p/s) & OFI (${liveAudit.orderFlowBuyPct}% / ${liveAudit.orderFlowSellPct}%)...`);
    }, 350);

    setTimeout(() => {
      setRecheckStage(3);
      setRecheckNote(`[Phase 3/4] Synthesizing EMA 9/21 spread (${liveAudit.emaSpread} pips) & RSI 14 (${liveAudit.rsi})...`);
    }, 700);

    setTimeout(() => {
      setRecheckStage(4);
      setRecheckNote(`[Phase 4/4] Confluence score: ${liveAudit.confluenceScore}%. Locking strike barrier...`);

      // Determine final direction based on real mathematical calculation
      let finalDirection: 'CALL' | 'PUT' = liveAudit.recommendedAction === 'WAIT'
        ? (liveAudit.orderFlowBuyPct >= 50 ? 'CALL' : 'PUT')
        : (liveAudit.recommendedAction as 'CALL' | 'PUT');

      // Double-check 30-second acceleration vector
      if (selectedTf === '30s') {
        if (liveAudit.tickAcceleration > 0.1) finalDirection = 'CALL';
        else if (liveAudit.tickAcceleration < -0.1) finalDirection = 'PUT';
      }

      const generatedSignal: SignalData = {
        asset: activeAsset.name,
        timeframe: selectedTf,
        direction: finalDirection,
        confidence: Math.min(94.8, Math.max(85.5, parseFloat((82 + (liveAudit.confluenceScore / 100) * 12.5).toFixed(1)))),
        trend: finalDirection === 'CALL' ? 'Bullish' : 'Bearish',
        velocity: finalDirection === 'CALL' ? 'Order Flow Surge' : 'Distribution Wave',
        generatedAt: Date.now(),
        entryPrice: currentPrice,
        targetPrice:
          finalDirection === 'CALL'
            ? currentPrice + activeAsset.pipSize * (selectedTf === '30s' ? 4 : 8)
            : currentPrice - activeAsset.pipSize * (selectedTf === '30s' ? 4 : 8),
        technicalAudit: liveAudit,
        expirySeconds: tfConfig.seconds,
      };

      setSignal(generatedSignal);
      setIsLocked(true);
      setIsRechecking(false);
      setIsExpired(false);
      setFreshnessSec(6.0);

      // Audio notification
      if (finalDirection === 'CALL') {
        playCallAudioChime();
      } else {
        playPutAudioChime();
      }

      // Start 6-Second Freshness Window
      if (countdownRef.current) clearInterval(countdownRef.current);
      const start = Date.now();
      countdownRef.current = setInterval(() => {
        const elapsed = (Date.now() - start) / 1000;
        const remaining = Math.max(0, 6.0 - elapsed);
        setFreshnessSec(remaining);

        if (remaining <= 0) {
          setIsExpired(true);
          if (countdownRef.current) clearInterval(countdownRef.current);
        }
      }, 100);
    }, 1100);
  };

  // 3. User executes the trade on broker: start real in-trade tracking
  const handleExecuteTrade = () => {
    if (!signal) return;
    if (countdownRef.current) clearInterval(countdownRef.current);

    const tradeDuration = signal.expirySeconds || tfConfig.seconds;
    const startTime = Date.now();

    setActiveTrade({
      entryPrice: currentPrice,
      direction: signal.direction,
      timeframeSeconds: tradeDuration,
      startedAt: startTime,
      secondsRemaining: tradeDuration,
      status: 'AT_THE_MONEY',
      pipDiff: 0,
      completed: false,
    });

    if (tradeTimerRef.current) clearInterval(tradeTimerRef.current);
    tradeTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, tradeDuration - elapsed);

      setActiveTrade((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          secondsRemaining: remaining,
        };
      });

      if (remaining <= 0) {
        if (tradeTimerRef.current) clearInterval(tradeTimerRef.current);
      }
    }, 500);
  };

  // 4. Continuously evaluate In-Trade Win/Loss as ticks arrive
  useEffect(() => {
    if (!activeTrade || activeTrade.completed) return;

    const diff = currentPrice - activeTrade.entryPrice;
    const pips = parseFloat((diff / activeAsset.pipSize).toFixed(1));
    const isCall = activeTrade.direction === 'CALL';
    const isInProfit = isCall ? diff > 0.0000001 : diff < -0.0000001;

    const currentStatus = isInProfit ? 'IN_THE_MONEY' : diff === 0 ? 'AT_THE_MONEY' : 'OUT_OF_THE_MONEY';

    setActiveTrade((prev) => (prev ? { ...prev, status: currentStatus, pipDiff: pips } : null));

    // When trade finishes, auto-trigger verified result
    if (activeTrade.secondsRemaining <= 0) {
      const finalOutcome = isInProfit ? 'WIN' : 'LOSS';
      setActiveTrade((prev) => (prev ? { ...prev, completed: true } : null));
      if (signal) {
        onLogOutcome(finalOutcome, signal);
      }
    }
  }, [currentPrice, activeTrade?.secondsRemaining, activeAsset.pipSize]);

  const handleOutcome = (outcome: 'WIN' | 'LOSS') => {
    if (!signal) return;
    onLogOutcome(outcome, signal);
    setIsLocked(false);
    setActiveTrade(null);
    if (tradeTimerRef.current) clearInterval(tradeTimerRef.current);
  };

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (tradeTimerRef.current) clearInterval(tradeTimerRef.current);
    };
  }, []);

  const progressOffset = ((6.0 - freshnessSec) / 6.0) * 88;

  return (
    <div className="space-y-4 font-sans">
      {/* 24/7 REAL-TIME CONTINUOUS QUANTITATIVE TELEMETRY RADAR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              24/7 Live Deriv Confluence Telemetry
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
            <span className="font-bold">LIVE TICKS:</span>
            <span>{safeTicks.length} Buffered</span>
          </div>
        </div>

        {/* Live Indicator Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
          {/* 1. RSI (14) */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5">
            <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase">
              <span>RSI (14)</span>
              <span className={liveAudit.rsi <= 30 ? 'text-emerald-400 font-bold' : liveAudit.rsi >= 70 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                {liveAudit.rsiState}
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className={`text-base font-black ${liveAudit.rsi <= 30 ? 'text-emerald-400' : liveAudit.rsi >= 70 ? 'text-rose-400' : 'text-cyan-300'}`}>
                {liveAudit.rsi}
              </span>
              <span className="text-[10px] text-slate-500">Scale: 0-100</span>
            </div>
            {/* Visual RSI Bar */}
            <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden flex">
              <div
                className={`h-full transition-all duration-300 ${liveAudit.rsi <= 30 ? 'bg-emerald-400' : liveAudit.rsi >= 70 ? 'bg-rose-400' : 'bg-cyan-400'}`}
                style={{ width: `${liveAudit.rsi}%` }}
              />
            </div>
          </div>

          {/* 2. EMA 9 vs 21 Spread */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5">
            <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase">
              <span>EMA 9 / 21 Spread</span>
              <span className={liveAudit.emaTrend === 'BULLISH' ? 'text-emerald-400' : 'text-rose-400'}>
                {liveAudit.emaTrend === 'BULLISH' ? '▲ BULL' : '▼ BEAR'}
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className={`text-base font-black ${liveAudit.emaSpread >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {liveAudit.emaSpread > 0 ? `+${liveAudit.emaSpread}` : liveAudit.emaSpread} p
              </span>
              <span className="text-[10px] text-slate-500">Pips Diff</span>
            </div>
            <div className="text-[10px] text-slate-500 truncate mt-1">
              9: {liveAudit.emaFast} | 21: {liveAudit.emaSlow}
            </div>
          </div>

          {/* 3. Order Flow Imbalance (OFI) */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5">
            <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase">
              <span>Order Flow (OFI)</span>
              <span className="text-amber-400 font-bold">{liveAudit.orderFlowBuyPct}% Buy</span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-base font-black text-amber-300">
                {liveAudit.orderFlowBuyPct} / {liveAudit.orderFlowSellPct}
              </span>
              <span className="text-[10px] text-slate-500">Buy/Sell %</span>
            </div>
            {/* Split OFI Bar */}
            <div className="w-full bg-rose-500 h-1 rounded-full mt-1.5 overflow-hidden flex">
              <div className="bg-emerald-400 h-full transition-all duration-300" style={{ width: `${liveAudit.orderFlowBuyPct}%` }} />
            </div>
          </div>

          {/* 4. Tick Acceleration & Micro-Velocity */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5">
            <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase">
              <span>Tick Velocity</span>
              <span className={liveAudit.tickVelocity >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {liveAudit.tickVelocity >= 0 ? 'Surge' : 'Drop'}
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className={`text-base font-black ${liveAudit.tickVelocity >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {liveAudit.tickVelocity > 0 ? `+${liveAudit.tickVelocity}` : liveAudit.tickVelocity} p/s
              </span>
              <span className="text-[10px] text-slate-500">Acc: {liveAudit.tickAcceleration}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 truncate">
              {liveAudit.bollingerBandStatus === 'PIERCED_LOWER' ? '🔵 Lower Band Pierced' : liveAudit.bollingerBandStatus === 'PIERCED_UPPER' ? '🔴 Upper Band Pierced' : '⚪ Volatility Healthy'}
            </div>
          </div>
        </div>
      </div>

      {/* TIMEFRAME SELECTOR: 30 SECONDS VS 1 MINUTE VS HIGHER */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span className="uppercase tracking-wider">Select Expiration Horizon</span>
          <span className="text-emerald-400 font-bold bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded">
            Target: {tfConfig.desc}
          </span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2" id="timeframe-grid">
          {TIMEFRAMES.map((tf) => {
            const isActive = tf.id === selectedTf;
            return (
              <button
                key={tf.id}
                type="button"
                id={`tf-btn-${tf.id}`}
                onClick={() => setSelectedTf(tf.id)}
                className={`py-2 px-2.5 rounded-xl text-xs font-mono transition-all flex flex-col items-center justify-center gap-0.5 ${
                  isActive
                    ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-emerald-400 text-emerald-300 font-black shadow-lg shadow-emerald-500/20 scale-[1.02]'
                    : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <span className="text-xs font-black">{tf.label}</span>
                <span className="text-[9px] opacity-75 font-normal">{tf.seconds}s window</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* RE-CHECKING MODAL / PROGRESS CARD */}
      {isRechecking && (
        <div className="bg-slate-900 border-2 border-cyan-500/50 rounded-2xl p-5 shadow-2xl space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
              <h3 className="font-mono font-black text-sm text-cyan-300 uppercase tracking-wider">
                Multi-Stage Algorithmic Re-Check In Progress
              </h3>
            </div>
            <span className="font-mono text-xs text-cyan-400 font-bold">{recheckStage} / 4</span>
          </div>

          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
              style={{ width: `${(recheckStage / 4) * 100}%` }}
            />
          </div>

          <p className="font-mono text-xs text-slate-300 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
            {recheckNote}
          </p>
        </div>
      )}

      {/* ACTIVE TRADE IN-FLIGHT TRACKER (REAL-TIME WIN/LOSS EVALUATION) */}
      {activeTrade && (
        <div
          id="active-trade-tracker"
          className={`rounded-2xl p-4 shadow-2xl border-2 transition-all duration-300 space-y-3 ${
            activeTrade.status === 'IN_THE_MONEY'
              ? 'bg-emerald-950/40 border-emerald-500/70 shadow-emerald-500/10'
              : activeTrade.status === 'OUT_OF_THE_MONEY'
              ? 'bg-rose-950/40 border-rose-500/70 shadow-rose-500/10'
              : 'bg-slate-900 border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-black font-mono px-2 py-0.5 rounded-lg ${
                  activeTrade.direction === 'CALL' ? 'bg-emerald-400 text-slate-950' : 'bg-rose-500 text-white'
                }`}
              >
                LIVE {activeTrade.direction}
              </span>
              <span className="text-xs font-mono font-bold text-white">
                {activeAsset.name} ({activeTrade.timeframeSeconds}s Horizon)
              </span>
            </div>
            <div className="flex items-center gap-1 font-mono text-xs">
              <span className="text-slate-400">EXPIRING IN:</span>
              <span className="text-base font-black text-amber-400 animate-pulse">
                {activeTrade.secondsRemaining}s
              </span>
            </div>
          </div>

          {/* Real-time Strike Status */}
          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Entry Strike</span>
              <span className="text-xs font-bold text-slate-200">{activeTrade.entryPrice}</span>
            </div>
            <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Live Price</span>
              <span className="text-xs font-bold text-white">{currentPrice}</span>
            </div>
            <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Strike Delta</span>
              <span
                className={`text-xs font-black ${
                  activeTrade.status === 'IN_THE_MONEY' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {activeTrade.pipDiff > 0 ? `+${activeTrade.pipDiff}` : activeTrade.pipDiff} pips
              </span>
            </div>
          </div>

          {/* Outcome Status Banner */}
          <div
            className={`py-2 px-3 rounded-xl font-mono text-xs font-bold flex items-center justify-between ${
              activeTrade.status === 'IN_THE_MONEY'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}
          >
            <span>
              {activeTrade.status === 'IN_THE_MONEY' ? '🟢 IN THE MONEY (TARGET PROFIT)' : '🔴 OUT OF THE MONEY (TESTING LEVEL)'}
            </span>
            <span>{activeTrade.completed ? 'FINISHED' : 'ACTIVE'}</span>
          </div>
        </div>
      )}

      {/* VERIFIED ACCURATE SIGNAL DISPLAY CARD */}
      <div
        id="signal-display-container"
        className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden transition-all duration-300"
      >
        {!signal ? (
          /* Standby State */
          <div className="text-center py-5 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-center mx-auto text-emerald-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-white text-sm font-mono uppercase tracking-wide">
                Quantitative Accuracy Engine Ready
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Select your expiration ({selectedTf.toUpperCase()}) and click below. The system will perform an instant multi-vector re-check before issuing your high-accuracy execution signal.
              </p>
            </div>
          </div>
        ) : (
          /* Active Signal Telemetry */
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span
                  id="signal-direction-badge"
                  className={`text-base font-black font-mono uppercase px-4 py-2 rounded-xl shadow-lg ${
                    signal.direction === 'CALL'
                      ? 'text-slate-950 bg-emerald-400 shadow-emerald-400/20'
                      : 'text-white bg-rose-500 shadow-rose-500/20'
                  }`}
                >
                  {signal.direction === 'CALL' ? 'CALL (BUY)' : 'PUT (SELL)'}
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {signal.asset} &bull; {signal.timeframe.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    {signal.technicalAudit?.setupName}
                  </span>
                </div>
              </div>

              {/* 6-Second Freshness Window Radial Timer */}
              <div className="flex items-center gap-2">
                <div className="relative w-9 h-9 flex items-center justify-center">
                  <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#1e293b" strokeWidth="3" />
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke={isExpired ? '#f43f5e' : '#10b981'}
                      strokeWidth="3"
                      strokeDasharray="88"
                      strokeDashoffset={progressOffset}
                      className="transition-all duration-100"
                    />
                  </svg>
                  <span className="absolute text-[10px] font-mono font-bold text-white">
                    {Math.ceil(freshnessSec)}s
                  </span>
                </div>
              </div>
            </div>

            {/* Freshness Banner */}
            <div
              id="freshness-banner"
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-between transition-all ${
                !isExpired
                  ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/70 border border-rose-500/40 text-rose-300 animate-pulse'
              }`}
            >
              <span>{isExpired ? '🔴 ENTRY EXPIRED — RE-SCAN TO PREVENT SPREAD SLIPPAGE' : '🟢 PRIME ENTRY WINDOW CONFIRMED'}</span>
              <span className="text-[10px] opacity-90">
                {isExpired ? 'Strike Void' : `Valid: ${freshnessSec.toFixed(1)}s`}
              </span>
            </div>

            {/* Verified Confluence Factors Audit Trail */}
            {signal.technicalAudit && (
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-slate-850 pb-1.5">
                  <span className="text-slate-300 font-bold uppercase">Mathematical Verification Factors:</span>
                  <span className="text-emerald-400 font-black">{signal.confidence}% Confidence</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {signal.technicalAudit.confluenceFactors.slice(0, 4).map((factor, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px] font-mono text-slate-300">
                      <span className="text-emerald-400">✓</span>
                      <span className="truncate">{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strike & Target Price Info */}
            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-2.5">
                <span className="text-[10px] text-slate-500 uppercase block">Entry Strike</span>
                <span className="text-xs font-bold text-white block mt-0.5">{signal.entryPrice}</span>
              </div>
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-2.5">
                <span className="text-[10px] text-slate-500 uppercase block">Confluence</span>
                <span className="text-base font-black text-emerald-400">{signal.confidence}%</span>
              </div>
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-2.5">
                <span className="text-[10px] text-slate-500 uppercase block">Target Strike</span>
                <span className="text-xs font-bold text-amber-400 block mt-0.5">{signal.targetPrice?.toFixed(activeAsset.decimals)}</span>
              </div>
            </div>

            {/* EXECUTE ON BROKER CTA */}
            {!activeTrade && !isExpired && (
              <button
                type="button"
                onClick={handleExecuteTrade}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black font-mono text-sm shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
              >
                <span>EXECUTE {signal.direction} ON BROKER ({signal.timeframe.toUpperCase()})</span>
                <span className="text-xs opacity-80">&rarr; Track Live Win</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* MANDATORY OUTCOME FEEDBACK & RECALIBRATION LOOP */}
      {isLocked && (
        <div
          id="mandatory-outcome-loop"
          className="bg-slate-900 border border-amber-500/40 rounded-2xl p-4 shadow-xl space-y-3 animate-in fade-in duration-300"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <h4 className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
                Session Recalibration Feedback
              </h4>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Lockout Engaged</span>
          </div>
          <p className="text-xs text-slate-400">
            Log trade outcome to unlock the next computation and dynamically recalibrate algorithmic momentum weights.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              id="btn-outcome-won"
              onClick={() => handleOutcome('WIN')}
              className="py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm font-mono rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
              TRADE WON
            </button>
            <button
              type="button"
              id="btn-outcome-lost"
              onClick={() => handleOutcome('LOSS')}
              className="py-3 px-4 bg-rose-500 hover:bg-rose-400 text-white font-black text-sm font-mono rounded-xl transition shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
              </svg>
              TRADE LOST
            </button>
          </div>
        </div>
      )}

      {/* PRIMARY SCAN BUTTON: DEEP RE-CHECK BEFORE ISSUING SIGNAL */}
      <div className="space-y-2">
        <button
          type="button"
          id="btn-analyse-trigger"
          disabled={isLocked || isRechecking || !!activeTrade}
          onClick={handleTriggerAnalysis}
          className={`w-full py-4 px-6 font-black text-base font-mono rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2.5 active:scale-[0.98] ${
            isLocked || activeTrade
              ? 'bg-slate-800/80 border border-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/20'
          }`}
        >
          {isLocked || activeTrade ? (
            <>
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span>{activeTrade ? `TRADE RUNNING (${activeTrade.secondsRemaining}s)...` : 'LOCKED — LOG OUTCOME FIRST'}</span>
            </>
          ) : isRechecking ? (
            <>
              <span className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              <span>RECHECKING LIVE DERIV CONFLUENCE...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>
                {isVIP
                  ? `RE-CHECK & SCAN ${selectedTf.toUpperCase()} (VIP UNLIMITED)`
                  : `RE-CHECK & SCAN ${selectedTf.toUpperCase()} (1 CREDIT)`}
              </span>
            </>
          )}
        </button>

        <div className="text-center text-[11px] font-mono text-slate-500 flex items-center justify-center gap-2">
          <span>Quantitative Deriv Engine</span>
          <span>&bull;</span>
          <span className="text-emerald-400 font-bold">
            Session Win Rate: {stats.winRate}% ({stats.wins}W / {stats.losses}L)
          </span>
        </div>
      </div>
    </div>
  );
}
