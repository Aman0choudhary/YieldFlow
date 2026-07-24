import { useState, useEffect } from 'react';
import { sdk } from '../sdk/yieldflow-sdk';
import type { EmployerStats } from '../sdk/types';
import { SectionHeader } from './SectionHeader';

export function EmployerDashboard({ onNavigate }: { onNavigate: (view: any) => void }) {
  const [stats, setStats] = useState<EmployerStats | null>(null);

  useEffect(() => {
    sdk.getEmployerStats().then(setStats);
  }, []);

  if (!stats) {
    return (
      <div className="df-cell hero-content" style={{ minHeight: '60vh', justifyContent: 'center' }}>
        <h2 className="text-gradient">Loading Treasury Vault...</h2>
      </div>
    );
  }

  const total = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.totalPool);
  const yieldEarned = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.yieldEarned);
  
  const bufferPercent = (stats.bufferStatus.available / stats.totalPool) * 100;
  const yieldPercent = (stats.bufferStatus.earningYield / stats.totalPool) * 100;

  const mockTransactions = [
    { id: 'tx_901', type: 'Yield Harvest', protocol: 'Blend Pool', amount: '+$1,420.50', date: '2026-07-24 10:14', status: 'Completed' },
    { id: 'tx_902', type: 'Payroll Deposit', protocol: 'Stellar Vault', amount: '+$50,000.00', date: '2026-07-20 09:00', status: 'Completed' },
    { id: 'tx_903', type: 'Yield Harvest', protocol: 'DeFindex Strategy', amount: '+$840.12', date: '2026-07-17 14:30', status: 'Completed' },
    { id: 'tx_904', type: 'Stream Outflow', protocol: 'Worker Claims', amount: '-$12,340.00', date: '2026-07-15 18:22', status: 'Settled' }
  ];

  return (
    <>
      {/* Navigation bar at top of page */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 var(--spacer-24)', marginTop: 'var(--spacer-16)' }}>
        <button className="btn btn-outline" style={{ fontSize: '12px' }} onClick={() => onNavigate('login')}>
          ← Back to Home Landing
        </button>
        <button className="btn btn-outline" style={{ fontSize: '12px' }} onClick={() => onNavigate('approvals')}>
          Manage Stream Approvals →
        </button>
      </div>

      {/* 01 — VAULT OVERVIEW */}
      <section className="section-block" style={{ paddingTop: 'var(--spacer-16)' }}>
        <SectionHeader
          index="01"
          eyebrow="TREASURY VAULT"
          thesis="Corporate payroll capital actively generating yield."
          paragraph="Committed payroll capital is partitioned into instant streaming liquidity and auto-compounding money market strategies on Soroban."
        />

        <div className="df-grid" style={{ marginTop: 'var(--spacer-24)' }}>
          <div className="df-cell grid-2-cell slide-up" style={{ animationDelay: '0.2s' }}>
            <span className="label" style={{ color: 'var(--grey-300)' }}>Total Vault Assets</span>
            <h1 className="display" style={{ fontSize: 'clamp(48px, 7vw, 96px)', marginTop: 'var(--spacer-12)' }}>{total}</h1>
            <p className="large text-gradient" style={{ marginTop: 'var(--spacer-12)' }}>
              + {yieldEarned} Yield Harvested
            </p>
          </div>

          <div className="df-cell grid-2-cell slide-up" style={{ animationDelay: '0.3s' }}>
            <span className="label" style={{ color: 'var(--grey-300)' }}>Liquidity Allocation</span>
            <h3 style={{ marginTop: 'var(--spacer-16)' }}>Yield vs. Instant Buffer</h3>
            
            <div style={{ display: 'flex', height: '16px', width: '100%', marginTop: 'var(--spacer-24)', gap: '2px', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${yieldPercent}%`, backgroundColor: 'var(--theme-accent)', transition: 'width 1s' }} />
              <div style={{ width: `${bufferPercent}%`, backgroundColor: 'var(--grey-300)', transition: 'width 1s' }} />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--spacer-16)' }}>
              <div>
                <div className="label text-gradient">Earning Yield (85%)</div>
                <div style={{ fontFamily: 'FK Roman Standard', fontSize: '24px', marginTop: '4px' }}>
                  ${stats.bufferStatus.earningYield.toLocaleString()}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="label" style={{ color: 'var(--grey-300)' }}>Buffer (15%)</div>
                <div style={{ fontFamily: 'FK Roman Standard', fontSize: '24px', color: 'var(--grey-300)', marginTop: '4px' }}>
                  ${stats.bufferStatus.available.toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--spacer-12)', marginTop: 'var(--spacer-32)' }}>
              <button className="btn" onClick={() => alert('Payroll Deposit workflow initiated.')}>Fund Vault</button>
              <button className="btn btn-outline" onClick={() => onNavigate('approvals')}>Manage Streams</button>
            </div>
          </div>
        </div>
      </section>

      {/* 02 — YIELD ANALYTICS */}
      <section className="section-block">
        <SectionHeader
          index="02"
          eyebrow="PERFORMANCE"
          thesis="Real-time yield generation curve."
          paragraph="Cumulative interest earned across Blend liquidity pools and DeFindex automated strategy vaults."
        />

        <div className="df-grid" style={{ marginTop: 'var(--spacer-24)' }}>
          <div className="df-cell full-width slide-up" style={{ animationDelay: '0.2s', padding: 'var(--spacer-32)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacer-24)' }}>
              <div>
                <span className="label" style={{ color: 'var(--theme-accent)' }}>7-Day APY Average</span>
                <h3 style={{ fontSize: '24px', marginTop: '4px' }}>4.82% APY</h3>
              </div>
              <span className="label" style={{ color: 'var(--grey-300)' }}>STOCKED VIA BLEND & DEFINDEX</span>
            </div>

            {/* Mock Line Chart SVG */}
            <div style={{ width: '100%', height: '220px', marginTop: 'var(--spacer-16)' }}>
              <svg width="100%" height="100%" viewBox="0 0 800 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2dd4a8" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#2dd4a8" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 160 Q 150 140, 300 110 T 600 50 T 800 20 L 800 200 L 0 200 Z"
                  fill="url(#chartGrad)"
                />
                <path
                  d="M 0 160 Q 150 140, 300 110 T 600 50 T 800 20"
                  fill="none"
                  stroke="var(--theme-accent)"
                  strokeWidth="3"
                />
                <circle cx="0" cy="160" r="4" fill="var(--theme-accent)" />
                <circle cx="300" cy="110" r="4" fill="var(--theme-accent)" />
                <circle cx="600" cy="50" r="4" fill="var(--theme-accent)" />
                <circle cx="800" cy="20" r="5" fill="#fff" stroke="var(--theme-accent)" strokeWidth="2" />
              </svg>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--spacer-16)' }} className="label">
              <span style={{ color: 'var(--grey-300)' }}>JUL 18</span>
              <span style={{ color: 'var(--grey-300)' }}>JUL 20</span>
              <span style={{ color: 'var(--grey-300)' }}>JUL 22</span>
              <span style={{ color: 'var(--theme-accent)' }}>TODAY (LIVE)</span>
            </div>
          </div>
        </div>
      </section>

      {/* 03 — RECENT TRANSACTIONS */}
      <section className="section-block">
        <SectionHeader
          index="03"
          eyebrow="LEDGER"
          thesis="Automated stream & yield events."
          paragraph="On-chain ledger events recorded on Stellar."
        />

        <div className="df-grid" style={{ marginTop: 'var(--spacer-24)' }}>
          <div className="df-cell full-width slide-up" style={{ animationDelay: '0.2s', padding: 0 }}>
            <table className="table-df">
              <thead>
                <tr>
                  <th>Event ID</th>
                  <th>Type</th>
                  <th>Protocol / Source</th>
                  <th>Amount</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {mockTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ color: 'var(--grey-300)' }}>{tx.id}</td>
                    <td style={{ fontWeight: 600 }}>{tx.type}</td>
                    <td style={{ color: 'var(--grey-300)' }}>{tx.protocol}</td>
                    <td style={{ color: tx.amount.startsWith('+') ? 'var(--theme-accent)' : 'var(--theme-fg)' }}>
                      {tx.amount}
                    </td>
                    <td style={{ color: 'var(--grey-300)' }}>{tx.date}</td>
                    <td>
                      <span className="label" style={{ color: 'var(--theme-accent)' }}>{tx.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 04 — TEAM OVERVIEW */}
      <section className="section-block">
        <SectionHeader
          index="04"
          eyebrow="STREAM METRICS"
          thesis="Active employee stream velocity."
          paragraph="Real-time summary of active worker streams and liquidity consumption."
        />

        <div className="df-grid" style={{ marginTop: 'var(--spacer-24)' }}>
          <div className="df-cell grid-3-cell slide-up" style={{ animationDelay: '0.2s' }}>
            <span className="label" style={{ color: 'var(--grey-300)' }}>Active Headcount</span>
            <h2 style={{ marginTop: 'var(--spacer-12)' }}>42 Workers</h2>
            <p style={{ marginTop: 'var(--spacer-8)', color: 'var(--grey-300)' }}>
              100% covered by Soroban passkey stream contracts.
            </p>
          </div>

          <div className="df-cell grid-3-cell slide-up" style={{ animationDelay: '0.3s' }}>
            <span className="label" style={{ color: 'var(--grey-300)' }}>Total Streamed to Date</span>
            <h2 style={{ marginTop: 'var(--spacer-12)' }}>$124,500.00</h2>
            <p style={{ marginTop: 'var(--spacer-8)', color: 'var(--grey-300)' }}>
              Zero streaming friction or delayed payroll cycles.
            </p>
          </div>

          <div className="df-cell grid-3-cell slide-up" style={{ animationDelay: '0.4s' }}>
            <span className="label" style={{ color: 'var(--grey-300)' }}>Buffer Efficiency</span>
            <h2 className="text-gradient" style={{ marginTop: 'var(--spacer-12)' }}>99.98%</h2>
            <p style={{ marginTop: 'var(--spacer-8)', color: 'var(--grey-300)' }}>
              Instant withdrawal claims served without un-stacking yield positions.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
