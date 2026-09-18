import React, { useEffect, useRef, useState } from 'react';
import type { AssetConfig } from '../types.ts';

interface LiveTickerProps {
  activeAsset: AssetConfig;
  onAssetChange: (asset: AssetConfig) => void;
  onPriceUpdate?: (price: number) => void;
  onTicksUpdate?: (ticks: number[]) => void;
}

export const ASSETS: AssetConfig[] = [
  { symbol: 'frxEURUSD', name: 'EUR/USD', type: 'FOREX', decimals: 5, pipSize: 0.0001 },
  { symbol: 'frxGBPUSD', name: 'GBP/USD', type: 'FOREX', decimals: 5, pipSize: 0.0001 },
  { symbol: 'frxXAUUSD', name: 'GOLD', type: 'COMMODITY', decimals: 2, pipSize: 0.01 },
  { symbol: 'R_100', name: 'VOL 100', type: 'SYNTH', decimals: 2, pipSize: 0.01 },
  { symbol: 'R_75', name: 'VOL 75', type: 'SYNTH', decimals: 2, pipSize: 0.01 },
];

export function LiveTicker({ activeAsset, onAssetChange, onPriceUpdate, onTicksUpdate }: LiveTickerProps) {
  const [currentPrice, setCurrentPrice] = useState<number>(1.08542);
  const [prevPrice, setPrevPrice] = useState<number>(1.08542);
  const [pricePulse, setPricePulse] = useState<'up' | 'down' | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [tickVelocity, setTickVelocity] = useState<string>('High (16 t/s)');
  
  const historyRef = useRef<number[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const tickCountRef = useRef<number>(0);

  // Initialize Deriv WebSocket feed
  useEffect(() => {
    let isMounted = true;
    historyRef.current = [];

    const connectWS = () => {
      try {
        if (wsRef.current) {
          wsRef.current.close();
        }
        const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=1089');
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setWsConnected(true);
          // Subscribe to active asset
          ws.send(JSON.stringify({ forget_all: 'ticks' }));
          ws.send(JSON.stringify({ ticks: activeAsset.symbol, subscribe: 1 }));
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data.tick && data.tick.symbol === activeAsset.symbol) {
              const quote = parseFloat(data.tick.quote);
              if (!isNaN(quote)) {
                processNewTick(quote);
              }
            }
          } catch (err) {
            // Ignore parse errors
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setWsConnected(false);
          // Auto-reconnect after 3s
          setTimeout(connectWS, 3000);
        };

        ws.onerror = () => {
          // Handled silently
        };
      } catch (e) {
        console.warn('WS Init notice', e);
      }
    };

    connectWS();

    // Fallback autonomous tick simulation if connection drops
    const simTimer = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        setCurrentPrice((prev) => {
          const delta = (Math.random() - 0.49) * (activeAsset.decimals === 5 ? 0.00018 : 0.45);
          const next = Math.max(0.00001, prev + delta);
          processNewTick(next);
          return next;
        });
      }
    }, 1100);

    return () => {
      isMounted = false;
      clearInterval(simTimer);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [activeAsset.symbol]);

  // Tick Velocity tracking loop
  useEffect(() => {
    const velInterval = setInterval(() => {
      const count = tickCountRef.current;
      tickCountRef.current = 0;
      if (count > 8) {
        setTickVelocity(`Surge (${count * 2} t/s)`);
      } else if (count > 3) {
        setTickVelocity(`High (${count * 2} t/s)`);
      } else {
        setTickVelocity(`Normal (${Math.max(count * 2, 4)} t/s)`);
      }
    }, 1000);
    return () => clearInterval(velInterval);
  }, []);

  const processNewTick = (newPrice: number) => {
    tickCountRef.current += 1;
    setPrevPrice((old) => {
      const diff = newPrice - old;
      if (diff > 0.0000001) {
        setPricePulse('up');
      } else if (diff < -0.0000001) {
        setPricePulse('down');
      }
      return old;
    });

    setCurrentPrice(newPrice);
    onPriceUpdate?.(newPrice);

    historyRef.current.push(newPrice);
    if (historyRef.current.length > 60) {
      historyRef.current.shift();
    }
    onTicksUpdate?.([...historyRef.current]);
    drawSparkline();
  };

  const drawSparkline = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const history = historyRef.current;
    if (history.length < 2) return;

    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = (max - min) || 0.0001;

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = pricePulse === 'down' ? '#f43f5e' : '#10b981';

    const step = w / (history.length - 1);
    history.forEach((val, i) => {
      const x = i * step;
      const y = h - ((val - min) / range) * (h - 8) - 4;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Subtle area fill
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    if (pricePulse === 'down') {
      grad.addColorStop(0, 'rgba(244, 63, 94, 0.2)');
      grad.addColorStop(1, 'rgba(244, 63, 94, 0.0)');
    } else {
      grad.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
      grad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
    }
    ctx.fillStyle = grad;
    ctx.fill();
  };

  const diff = currentPrice - prevPrice;

  return (
    <div className="space-y-3">
      {/* Asset Selector Grid */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span className="uppercase tracking-wider">Trading Asset Feed</span>
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className={wsConnected ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
              {wsConnected ? 'Deriv WS (1089)' : 'Feed Standby'}
            </span>
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1.5" id="asset-selector-tabs">
          {ASSETS.map((asset) => {
            const isActive = asset.symbol === activeAsset.symbol;
            return (
              <button
                key={asset.symbol}
                type="button"
                id={`tab-${asset.symbol}`}
                onClick={() => onAssetChange(asset)}
                className={`py-2 px-1 rounded-xl text-center transition-all ${
                  isActive
                    ? 'bg-slate-900 border border-emerald-500/80 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="text-[10px] font-mono text-slate-400 leading-none">{asset.type}</div>
                <div className={`text-xs font-bold font-mono mt-1 ${isActive ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {asset.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Ticker Display Card */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase text-slate-400 tracking-wider">
              {activeAsset.name} Live Price
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span
                id="live-price-display"
                className={`text-2xl sm:text-3xl font-black font-mono tracking-tight px-2 py-0.5 rounded-lg transition-all duration-200 ${
                  pricePulse === 'up'
                    ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : pricePulse === 'down'
                    ? 'bg-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                    : 'text-white'
                }`}
              >
                {currentPrice.toFixed(activeAsset.decimals)}
              </span>
              <span
                className={`text-xs font-mono font-bold flex items-center ${
                  diff >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {diff >= 0 ? `▲ +${diff.toFixed(activeAsset.decimals)}` : `▼ ${diff.toFixed(activeAsset.decimals)}`}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Tick Velocity</span>
            <span className="text-xs font-mono font-bold text-cyan-400">{tickVelocity}</span>
            <div className="text-[10px] font-mono text-slate-500 mt-0.5">
              Spread: {activeAsset.decimals === 5 ? '0.2 pip' : '0.05 pt'}
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-slate-800/80">
          <canvas ref={canvasRef} width={380} height={42} className="w-full h-10 block" />
        </div>
      </div>
    </div>
  );
}
