/**
 * PulseTrade Pro - Shared TypeScript Definitions
 */

export interface AssetConfig {
  symbol: string;
  name: string;
  type: 'FOREX' | 'COMMODITY' | 'SYNTH';
  decimals: number;
  pipSize: number;
}

export interface TechnicalAudit {
  rsi: number;
  rsiState: 'OVERSOLD' | 'OVERBOUGHT' | 'NEUTRAL' | 'BULLISH_MOMENTUM' | 'BEARISH_MOMENTUM';
  emaFast: number;
  emaSlow: number;
  emaSpread: number;
  emaTrend: 'BULLISH' | 'BEARISH' | 'CROSSOVER_UP' | 'CROSSOVER_DOWN';
  orderFlowBuyPct: number;
  orderFlowSellPct: number;
  tickVelocity: number;
  tickAcceleration: number;
  bollingerBandStatus: 'PIERCED_LOWER' | 'PIERCED_UPPER' | 'MIDDLE_EXPANDING' | 'SQUEEZE';
  bollingerPctB: number;
  confluenceScore: number;
  confluenceFactors: string[];
  recheckSteps: string[];
  setupName: string;
  recommendedAction: 'CALL' | 'PUT' | 'WAIT';
}

export interface SignalData {
  asset: string;
  timeframe: string;
  direction: 'CALL' | 'PUT';
  confidence: number;
  trend: 'Bullish' | 'Bearish';
  velocity: string;
  generatedAt: number;
  targetPrice?: number;
  entryPrice?: number;
  technicalAudit?: TechnicalAudit;
  expirySeconds?: number;
}

export interface SessionStats {
  total: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface PricingTier {
  id: number;
  credits: number;
  bonus: number;
  price: number;
  label: string;
  badge?: string;
}

export interface CryptoWallet {
  id: number;
  coinName: string;
  symbol: string;
  network: string;
  address: string;
  active: boolean;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  credits: number;
  is_vip: boolean;
  vip_expires_at?: string | null;
  vip_days_left: number;
  vip_hours_left: number;
  vip_seconds_left: number;
}

export interface BlogArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string[];
  author: string;
  authorRole: string;
  readTime: string;
  date: string;
  category: string;
  imageUrl: string;
  tags: string[];
  keyTakeaways: string[];
}

export type PageView = 'landing' | 'cockpit' | 'blog' | 'about' | 'pricing' | 'admin' | 'files';

export type AuthModalMode = 'login' | 'register' | 'profile' | 'redeem-vip' | null;
