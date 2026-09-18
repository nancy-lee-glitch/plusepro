import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Cache client instance
let supabaseInstance: SupabaseClient | null = null;
let currentConfigKey = '';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

/**
 * Get active Supabase configuration from environment or localStorage
 */
export function getSupabaseConfig(): SupabaseConfig {
  const meta = import.meta as unknown as { env?: Record<string, string | undefined> };
  const envUrl = meta.env?.VITE_SUPABASE_URL || '';
  const envAnonKey = meta.env?.VITE_SUPABASE_ANON_KEY || '';

  // Check if user set custom Supabase credentials in browser storage
  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('pulsetrade_supabase_url') : null;
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem('pulsetrade_supabase_key') : null;

  const url = (storedUrl || envUrl || '').trim();
  const anonKey = (storedKey || envAnonKey || '').trim();

  return { url, anonKey };
}

/**
 * Check if valid Supabase credentials are configured
 */
export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && url.startsWith('http') && anonKey && anonKey.length > 20);
}

/**
 * Get or initialize Supabase client
 */
export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseConfig();

  if (!url || !anonKey || !url.startsWith('http')) {
    return null;
  }

  const keyCombination = `${url}_${anonKey}`;
  if (supabaseInstance && currentConfigKey === keyCombination) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    currentConfigKey = keyCombination;
    return supabaseInstance;
  } catch (err) {
    console.warn('[Supabase Client Error]', err);
    return null;
  }
}

/**
 * Test Supabase connectivity and table presence
 */
export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string; activeTraders?: number }> {
  try {
    if (!url.startsWith('https://') && !url.startsWith('http://')) {
      return { success: false, message: 'Invalid URL format. Project URL must start with https://' };
    }
    if (anonKey.length < 25) {
      return { success: false, message: 'Invalid Anon Public Key provided.' };
    }

    const testClient = createClient(url, anonKey);
    
    // Check connection by pinging active_sessions
    const { data, error } = await testClient
      .from('active_sessions')
      .select('session_id')
      .limit(5);

    if (error) {
      // If table doesn't exist yet, notify user to run the SQL schema script
      if (error.code === '42P01') {
        return {
          success: false,
          message: 'Connected to Supabase project, but the tables are missing. Please paste and run supabase_schema.sql in the Supabase SQL Editor.',
        };
      }
      return { success: false, message: `Supabase Error: ${error.message}` };
    }

    return {
      success: true,
      message: 'Successfully connected to live Supabase PostgreSQL database!',
      activeTraders: data?.length || 1,
    };
  } catch (err: any) {
    return { success: false, message: `Connection failed: ${err?.message || 'Unknown network error'}` };
  }
}

/**
 * Save user custom Supabase credentials
 */
export function saveCustomSupabaseConfig(url: string, anonKey: string) {
  if (typeof window !== 'undefined') {
    if (url && anonKey) {
      localStorage.setItem('pulsetrade_supabase_url', url.trim());
      localStorage.setItem('pulsetrade_supabase_key', anonKey.trim());
    } else {
      localStorage.removeItem('pulsetrade_supabase_url');
      localStorage.removeItem('pulsetrade_supabase_key');
    }
    supabaseInstance = null;
    currentConfigKey = '';
  }
}

/**
 * Real-Time Presence Heartbeat (100% Genuine Connected Traders)
 */
export async function sendSupabasePresence(sessionId: string, userId: number | null, activeAsset: string): Promise<number | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    // 1. Upsert active session
    await client.from('active_sessions').upsert(
      {
        session_id: sessionId,
        user_id: userId,
        active_asset: activeAsset,
        last_heartbeat: new Date().toISOString(),
        ip_address: 'client_connection',
      },
      { onConflict: 'session_id' }
    );

    // 2. Count active sessions within the last 45 seconds
    const cutoff = new Date(Date.now() - 45000).toISOString();
    const { count, error } = await client
      .from('active_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('last_heartbeat', cutoff);

    if (error) {
      console.warn('[Supabase Presence Query Warning]', error.message);
      return null;
    }

    return count ?? 1;
  } catch (err) {
    console.warn('[Supabase Heartbeat Exception]', err);
    return null;
  }
}

/**
 * Record Quantitative Signal in Supabase
 */
export async function logSignalToSupabase(signal: any, userId?: number | null) {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('signals').insert({
      user_id: userId || null,
      asset: signal.asset,
      timeframe: signal.timeframe,
      direction: signal.direction,
      entry_price: signal.entryPrice,
      target_price: signal.targetPrice,
      stop_loss: signal.mt5?.stopLossPrice || null,
      take_profit_1: signal.mt5?.takeProfit1Price || null,
      take_profit_2: signal.mt5?.takeProfit2Price || null,
      confidence: signal.confidence,
      confluence_factors: signal.technicalAudit?.confluenceFactors || [],
      setup_name: signal.technicalAudit?.setupName || 'Algorithmic Signal',
    });

    if (error) {
      console.warn('[Supabase Log Signal Error]', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase Log Signal Exception]', err);
    return false;
  }
}

/**
 * Record Verified Trade Outcome in Supabase
 */
export async function logOutcomeToSupabase(outcome: 'WIN' | 'LOSS', signal: any, userId?: number | null) {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('trade_outcomes').insert({
      user_id: userId || null,
      asset: signal.asset,
      timeframe: signal.timeframe,
      direction: signal.direction,
      entry_price: signal.entryPrice,
      outcome: outcome,
    });

    if (error) {
      console.warn('[Supabase Log Outcome Error]', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase Log Outcome Exception]', err);
    return false;
  }
}
