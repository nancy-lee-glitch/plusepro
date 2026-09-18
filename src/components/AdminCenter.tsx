import React, { useState } from 'react';

export function AdminCenter() {
  const [activeTab, setActiveTab] = useState<'settings' | 'tiers' | 'users' | 'abuse'>('users');
  const [apiKey, setApiKey] = useState('a1b2c3d4e5f6-mock-nowpayments-key');
  const [ipLimit, setIpLimit] = useState('2');
  const [freeCredits, setFreeCredits] = useState('10');
  const [saved, setSaved] = useState(false);

  const [usersList, setUsersList] = useState([
    {
      id: 1,
      username: 'quant_trader_alex',
      email: 'alex@alphadesk.org',
      credits: 25,
      is_vip: true,
      vip_days_left: 28,
      vip_expires_at: '2026-10-14 18:30:00',
    },
    {
      id: 2,
      username: 'sarah_forex_pro',
      email: 'sarah.fx@signalgroup.io',
      credits: 10,
      is_vip: true,
      vip_days_left: 12,
      vip_expires_at: '2026-09-28 09:15:00',
    },
    {
      id: 3,
      username: 'novice_scalper',
      email: 'scalp99@gmail.com',
      credits: 10,
      is_vip: false,
      vip_days_left: 0,
      vip_expires_at: null,
    },
  ]);

  const [ipLogs, setIpLogs] = useState([
    { ip: '127.0.0.1', count: 1, lastUser: 'pilot_trader', status: 'SAFE' },
    { ip: '192.168.1.45', count: 2, lastUser: 'alpha_whale', status: 'MAX_REACHED' },
    { ip: '10.0.0.88', count: 3, lastUser: 'bot_harvester_9', status: 'BLOCKED' },
  ]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleResetIp = (ipToReset: string) => {
    setIpLogs((prev) => prev.filter((item) => item.ip !== ipToReset));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5 font-mono">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">PulseTrade Command Center</h3>
            <span className="text-[10px] text-slate-400">System Admin & Security Control (`admin.php`)</span>
          </div>
        </div>

        <a
          href="/admin.php"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg hover:bg-amber-500/20 transition flex items-center gap-1"
        >
          <span>Open admin.php</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`py-2 px-3 border-b-2 font-bold transition ${
            activeTab === 'users'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Users &amp; 30-Day VIP
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`py-2 px-3 border-b-2 font-bold transition ${
            activeTab === 'settings'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Global Settings
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('abuse')}
          className={`py-2 px-3 border-b-2 font-bold transition ${
            activeTab === 'abuse'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Anti-Abuse IP Guard
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('tiers')}
          className={`py-2 px-3 border-b-2 font-bold transition ${
            activeTab === 'tiers'
              ? 'border-amber-400 text-amber-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Pricing Packages
        </button>
      </div>

      {/* Tab: Users & 30-Day VIP Slot Allocator */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3.5 space-y-1 text-xs font-mono">
            <div className="text-amber-300 font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Strict 30-Day Expiration Policy Enforcement</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Every granted VIP slot automatically expires after precisely 30 calendar days (720 hours). The system automatically cuts off signal access when the timestamp elapses, preventing unauthorized overstay or giving slots to the wrong individuals.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 uppercase text-[10px]">
                  <th className="p-2">User / Identity</th>
                  <th className="p-2">Credits</th>
                  <th className="p-2">VIP Status</th>
                  <th className="p-2">30-Day Window</th>
                  <th className="p-2 text-right">VIP Slot Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30">
                    <td className="p-2">
                      <div className="font-bold text-white">{u.username}</div>
                      <div className="text-[10px] text-slate-500">{u.email}</div>
                    </td>
                    <td className="p-2 text-emerald-400 font-bold">{u.credits} CR</td>
                    <td className="p-2">
                      {u.is_vip ? (
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded text-[10px] font-bold">
                          ★ ACTIVE VIP
                        </span>
                      ) : (
                        <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[10px]">
                          STANDARD
                        </span>
                      )}
                    </td>
                    <td className="p-2 text-[11px]">
                      {u.is_vip ? (
                        <div>
                          <div className="text-amber-300 font-bold">{u.vip_days_left} Days Remaining</div>
                          <div className="text-[10px] text-slate-500">{u.vip_expires_at}</div>
                        </div>
                      ) : (
                        <span className="text-slate-600">Not Active</span>
                      )}
                    </td>
                    <td className="p-2 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setUsersList((prev) =>
                            prev.map((item) =>
                              item.id === u.id
                                ? {
                                    ...item,
                                    is_vip: !item.is_vip,
                                    vip_days_left: !item.is_vip ? 30 : 0,
                                    vip_expires_at: !item.is_vip
                                      ? '2026-10-16 18:00:00'
                                      : null,
                                  }
                                : item
                            )
                          );
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                          u.is_vip
                            ? 'bg-rose-950/80 border-rose-800 text-rose-300 hover:bg-rose-900'
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold border-amber-400'
                        }`}
                      >
                        {u.is_vip ? 'Revoke Slot' : 'Grant 30-Day VIP'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 1: Global Settings */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="nowpayments-api-key" className="text-[10px] text-slate-400 uppercase tracking-wider block">
                NowPayments API Key
              </label>
              <input
                type="password"
                id="nowpayments-api-key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="max-accounts-per-ip" className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Max Accounts Per IP (Bonus Harvesting Limit)
              </label>
              <input
                type="number"
                id="max-accounts-per-ip"
                value={ipLimit}
                onChange={(e) => setIpLimit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="free-signup-credits" className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Free Signup Credits
              </label>
              <input
                type="number"
                id="free-signup-credits"
                value={freeCredits}
                onChange={(e) => setFreeCredits(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="primary-database-driver" className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Primary Database Driver
              </label>
              <input
                type="text"
                id="primary-database-driver"
                disabled
                value="MySQL PDO (Auto-Healing SQLite Fallback Active)"
                className="w-full bg-slate-950/50 border border-slate-800/80 rounded-xl py-2 px-3 text-xs text-emerald-400 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              id="btn-save-admin-settings"
              className="py-2.5 px-5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase rounded-xl transition"
            >
              Update Parameters
            </button>
            {saved && (
              <span className="text-xs text-emerald-400 font-bold animate-in fade-in">
                Configuration Updated Successfully!
              </span>
            )}
          </div>
        </form>
      )}

      {/* Tab 2: IP Abuse Inspector */}
      {activeTab === 'abuse' && (
        <div className="space-y-3">
          <div className="text-xs text-slate-400">
            Real-time IP registration audit ledger preventing sybil attacks and free bonus depletion:
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
              <thead className="bg-slate-950 text-slate-400 font-mono">
                <tr>
                  <th className="p-2.5">IP Address</th>
                  <th className="p-2.5">Accounts Registered</th>
                  <th className="p-2.5">Recent User</th>
                  <th className="p-2.5">Security Status</th>
                  <th className="p-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
                {ipLogs.map((log) => (
                  <tr key={log.ip} className="hover:bg-slate-950/40">
                    <td className="p-2.5 text-white font-bold">{log.ip}</td>
                    <td className="p-2.5 text-slate-300">{log.count} / 2 limit</td>
                    <td className="p-2.5 text-slate-400">{log.lastUser}</td>
                    <td className="p-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'SAFE'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : log.status === 'MAX_REACHED'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleResetIp(log.ip)}
                        className="text-xs text-slate-400 hover:text-amber-300 underline"
                      >
                        Reset Limit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Pricing Packages */}
      {activeTab === 'tiers' && (
        <div className="space-y-3">
          <div className="text-xs text-slate-400">
            Active Monetization Tiers managed by database:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
              <div className="text-slate-400 font-bold">Starter Pack</div>
              <div className="text-white font-black text-base mt-1">$5.00</div>
              <div className="text-emerald-400 text-[10px]">10 Credits</div>
            </div>
            <div className="bg-slate-950 border border-emerald-500/50 p-3 rounded-xl">
              <div className="text-emerald-300 font-bold">Popular Pack</div>
              <div className="text-white font-black text-base mt-1">$10.00</div>
              <div className="text-emerald-400 text-[10px]">25 + 5 Bonus Credits</div>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
              <div className="text-slate-400 font-bold">Pro Trader</div>
              <div className="text-white font-black text-base mt-1">$20.00</div>
              <div className="text-emerald-400 text-[10px]">60 + 20 Bonus Credits</div>
            </div>
            <div className="bg-slate-950 border border-amber-500/50 p-3 rounded-xl">
              <div className="text-amber-300 font-bold">Whale Alpha</div>
              <div className="text-white font-black text-base mt-1">$45.00</div>
              <div className="text-amber-400 text-[10px]">150 + 60 Bonus Credits</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
