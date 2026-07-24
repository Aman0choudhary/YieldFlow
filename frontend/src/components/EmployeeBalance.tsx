import { useState, useEffect } from 'react';
import { sdk } from '../sdk/yieldflow-sdk';
import type { EmployeeBalance as EmployeeBalanceType } from '../sdk/types';
import { SectionHeader } from './SectionHeader';

function AnimatedDigit({ char }: { char: string }) {
  const [current, setCurrent] = useState(char);
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    if (char !== current) {
      setChanging(true);
      const timer = setTimeout(() => {
        setCurrent(char);
        setChanging(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [char, current]);

  if (char === '.' || char === ',' || char === '$') {
    return <span className="live-counter-digit">{char}</span>;
  }

  return (
    <span className={`live-counter-digit ${changing ? 'changing text-gradient' : ''}`}>
      {current}
    </span>
  );
}

export function EmployeeBalance({ onNavigate }: { onNavigate?: (view: any) => void }) {
  const [data, setData] = useState<EmployeeBalanceType | null>(null);
  const [liveValue, setLiveValue] = useState<number>(0);
  const [startTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sdk.getEmployeeBalance('emp_001').then(res => {
      setData(res);
      setLiveValue(res.unlockedAmount);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!data) return;
    const interval = setInterval(() => {
      const elapsedSeconds = (Date.now() - startTime) / 1000;
      setLiveValue(data.unlockedAmount + elapsedSeconds * data.ratePerSecond);
    }, 1000);

    return () => clearInterval(interval);
  }, [data, startTime]);

  if (loading) {
    return (
      <div className="df-cell hero-content" style={{ minHeight: '60vh', justifyContent: 'center' }}>
        <h2 className="text-gradient">Authenticating Passkey...</h2>
      </div>
    );
  }

  const formattedValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 5,
    maximumFractionDigits: 5
  }).format(liveValue);

  const mockWithdrawals = [
    { id: 'w_101', date: '2026-07-22 14:02', amount: '$450.00', dest: 'Bank Transfer (USDC)', status: 'Settled' },
    { id: 'w_102', date: '2026-07-18 09:15', amount: '$820.00', dest: 'Stellar Wallet', status: 'Settled' },
    { id: 'w_103', date: '2026-07-14 17:40', amount: '$300.00', dest: 'Bank Transfer (USDC)', status: 'Settled' }
  ];

  return (
    <>
      {/* Navigation bar at top of page */}
      {onNavigate && (
        <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '0 var(--spacer-24)', marginTop: 'var(--spacer-16)' }}>
          <button className="btn btn-outline" style={{ fontSize: '12px' }} onClick={() => onNavigate('login')}>
            ← Back to Home Landing
          </button>
        </div>
      )}

      {/* 01 — UNLOCKED EARNINGS */}
      <section className="section-block" style={{ paddingTop: 'var(--spacer-16)' }}>
        <SectionHeader
          index="01"
          eyebrow="LIVE EARNINGS STREAM"
          thesis="Your wages unlocking second-by-second."
          paragraph="Powered by Soroban real-time stream contracts. Withdraw any portion of your unlocked balance instantly."
        />

        <div className="df-grid" style={{ marginTop: 'var(--spacer-24)' }}>
          <div className="df-cell full-width slide-up" style={{ textAlign: 'center', padding: 'var(--spacer-48) var(--spacer-24)' }}>
            <span className="label" style={{ color: 'var(--theme-accent)', display: 'block', marginBottom: 'var(--spacer-16)' }}>
              AVAILABLE LIQUID BALANCE
            </span>
            <h1 className="display" style={{ fontSize: 'clamp(44px, 9vw, 150px)' }}>
              {formattedValue.split('').map((char, i) => (
                <AnimatedDigit key={i} char={char} />
              ))}
            </h1>
            <p className="large" style={{ marginTop: 'var(--spacer-24)', color: 'var(--grey-300)' }}>
              Stream Rate: <span style={{ color: 'var(--theme-fg)', fontWeight: 600 }}>${(data?.ratePerSecond! * 3600).toFixed(2)}/hr</span>
            </p>

            <div style={{ marginTop: 'var(--spacer-32)' }}>
              <button
                className="btn"
                style={{ fontSize: '16px', padding: 'var(--spacer-16) var(--spacer-32)' }}
                onClick={() => alert(`Successfully initiated instant withdrawal of ${formattedValue}`)}
              >
                Withdraw Instantly (Zero Fee)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 02 — WITHDRAWAL HISTORY */}
      <section className="section-block">
        <SectionHeader
          index="02"
          eyebrow="SETTLEMENTS"
          thesis="Instant off-ramps with zero protocol fee."
          paragraph="Past salary claims executed on the Stellar network."
        />

        <div className="df-grid" style={{ marginTop: 'var(--spacer-24)' }}>
          <div className="df-cell full-width slide-up" style={{ animationDelay: '0.2s', padding: 0 }}>
            <table className="table-df">
              <thead>
                <tr>
                  <th>Withdrawal ID</th>
                  <th>Date & Time</th>
                  <th>Destination</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {mockWithdrawals.map((item) => (
                  <tr key={item.id}>
                    <td style={{ color: 'var(--grey-300)' }}>{item.id}</td>
                    <td style={{ color: 'var(--grey-300)' }}>{item.date}</td>
                    <td>{item.dest}</td>
                    <td style={{ fontWeight: 600, color: 'var(--theme-accent)' }}>{item.amount}</td>
                    <td>
                      <span className="label" style={{ color: 'var(--theme-accent)' }}>{item.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 03 — YIELD BREAKDOWN */}
      <section className="section-block">
        <SectionHeader
          index="03"
          eyebrow="HOW YOU EARN"
          thesis="Employer yield offsets protocol fees for workers."
          paragraph="While your salary sits un-claimed in the employer's smart vault, it generates interest in Stellar money markets. That yield subsidizes free instant withdrawals and network gas for all employees."
        />

        <div className="df-grid" style={{ marginTop: 'var(--spacer-24)' }}>
          <div className="df-cell grid-2-cell slide-up" style={{ animationDelay: '0.2s' }}>
            <span className="label" style={{ color: 'var(--grey-300)' }}>01 / NO LOCKUPS</span>
            <h3 style={{ marginTop: 'var(--spacer-12)', marginBottom: 'var(--spacer-8)' }}>100% On-Demand Access</h3>
            <p style={{ color: 'var(--grey-300)' }}>
              You don't need to wait until payday. As hours pass, your wages become available immediately.
            </p>
          </div>

          <div className="df-cell grid-2-cell slide-up" style={{ animationDelay: '0.3s' }}>
            <span className="label" style={{ color: 'var(--grey-300)' }}>02 / ZERO COST</span>
            <h3 style={{ marginTop: 'var(--spacer-12)', marginBottom: 'var(--spacer-8)' }}>Free Off-Ramping</h3>
            <p style={{ color: 'var(--grey-300)' }}>
              Gas and bridge costs are fully covered by treasury yield generation events.
            </p>
          </div>
        </div>
      </section>

      {/* 04 — ACCOUNT SETTINGS / SECURITY */}
      <section className="section-block">
        <SectionHeader
          index="04"
          eyebrow="SECURITY"
          thesis="Cryptographic passkey authentication on Soroban."
          paragraph="Your account is secured by hardware-backed WebAuthn credentials. No private key management required."
        />

        <div className="df-grid" style={{ marginTop: 'var(--spacer-24)' }}>
          <div className="df-cell grid-2-cell slide-up" style={{ animationDelay: '0.2s' }}>
            <span className="label" style={{ color: 'var(--theme-accent)' }}>PASSKEY STATUS</span>
            <h3 style={{ marginTop: 'var(--spacer-12)' }}>Hardware Enclave Active</h3>
            <p style={{ marginTop: 'var(--spacer-8)', color: 'var(--grey-300)' }}>
              Passkey signature verification bound to Soroban Smart Account `G...9A4F`.
            </p>
          </div>

          <div className="df-cell grid-2-cell slide-up" style={{ animationDelay: '0.3s' }}>
            <span className="label" style={{ color: 'var(--grey-300)' }}>AUTHENTICATED DEVICES</span>
            <div style={{ marginTop: 'var(--spacer-16)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--spacer-8) 0', borderBottom: '1px solid var(--grey-100)' }}>
                <span>iPhone 15 Pro (FaceID Passkey)</span>
                <span className="label" style={{ color: 'var(--theme-accent)' }}>PRIMARY</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--spacer-8) 0' }}>
                <span>MacBook Pro TouchID</span>
                <span className="label" style={{ color: 'var(--grey-300)' }}>BACKUP</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
