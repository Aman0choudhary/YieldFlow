import { SectionHeader } from './SectionHeader';

export function LoginScreen({ onNavigate }: { onNavigate: (view: any) => void }) {
  const integrations = [
    { name: 'Stellar', category: 'Chain' },
    { name: 'Soroban', category: 'Contracts' },
    { name: 'DeFindex', category: 'Yield' },
    { name: 'Blend', category: 'Yield' },
    { name: 'Passkey Kit', category: 'Auth' },
    { name: 'OpenZeppelin Relayer', category: 'Infra' }
  ];

  return (
    <>
      {/* HERO / WELCOME */}
      <section className="hero df-grid">
        <div className="df-cell hero-content">
          <div className="fade-in">
            <span className="label" style={{ color: 'var(--theme-accent)', marginBottom: 'var(--spacer-12)', display: 'block' }}>
              Real-Time Streaming Payroll on Stellar
            </span>
            <h1 className="display">YieldFlow</h1>
          </div>
          <div className="hero-text slide-up" style={{ animationDelay: '0.2s' }}>
            <p className="large">
              Earn Yield. Stream Pay. Empower Every Day.
            </p>
          </div>
          <div className="slide-up" style={{ animationDelay: '0.3s', display: 'flex', gap: 'var(--spacer-16)', justifyContent: 'center', marginTop: 'var(--spacer-24)' }}>
            <button className="btn" onClick={() => onNavigate('employer')}>
              Launch Employer Vault
            </button>
            <button className="btn btn-outline" onClick={() => onNavigate('employee')}>
              Employee Passkey Portal
            </button>
          </div>
        </div>
      </section>

      {/* 01 — ABOUT */}
      <section className="section-block">
        <SectionHeader
          index="01"
          eyebrow="ABOUT"
          thesis="Idle payroll shouldn't sit idle."
          paragraph="YieldFlow routes committed payroll capital directly into non-custodial money market vaults on Stellar until the exact second employees stream their earned wages."
        />
        <div className="df-grid content-section" style={{ marginTop: 'var(--spacer-24)' }}>
          <div className="df-cell slide-up" style={{ animationDelay: '0.4s' }}>
            <span className="label" style={{ color: 'var(--grey-300)' }}>FOR COMPANIES</span>
            <h2 style={{ marginTop: 'var(--spacer-16)', marginBottom: 'var(--spacer-12)' }}>Employer Vaults</h2>
            <p style={{ flex: 1 }}>
              Deposit monthly payroll pool once. Capital automatically generates yield via Soroban smart vaults while maintaining instant liquidity buffers for streaming payroll.
            </p>
            <button
              className="btn btn-outline"
              style={{ marginTop: 'var(--spacer-24)', alignSelf: 'flex-start' }}
              onClick={() => onNavigate('employer')}
            >
              Connect as Employer
            </button>
          </div>

          <div className="df-cell slide-up" style={{ animationDelay: '0.5s' }}>
            <span className="label" style={{ color: 'var(--theme-accent)' }}>FOR TEAMS</span>
            <h2 className="text-gradient" style={{ marginTop: 'var(--spacer-16)', marginBottom: 'var(--spacer-12)' }}>Worker Streaming</h2>
            <p style={{ flex: 1 }}>
              Unlock your account with biometric Passkeys to watch your earnings unlock in real time. Withdraw instantly with zero gas fees or protocol overhead.
            </p>
            <button
              className="btn"
              style={{ marginTop: 'var(--spacer-24)', alignSelf: 'flex-start' }}
              onClick={() => onNavigate('employee')}
            >
              Unlock with Passkey
            </button>
          </div>
        </div>
      </section>

      {/* 02 — HOW IT WORKS */}
      <section className="section-block">
        <SectionHeader
          index="02"
          eyebrow="MECHANICS"
          thesis="Continuous liquidity powered by Stellar and Soroban."
          paragraph="Automated capital routing ensures zero drag on employer treasury while delivering second-by-second salary streaming."
        />
        <div className="df-grid" style={{ marginTop: 'var(--spacer-24)' }}>
          <div className="df-cell grid-3-cell slide-up" style={{ animationDelay: '0.2s' }}>
            <span className="label" style={{ color: 'var(--theme-accent)' }}>01 / DEPOSIT</span>
            <h3 style={{ marginTop: 'var(--spacer-16)', marginBottom: 'var(--spacer-8)' }}>Fund Smart Vault</h3>
            <p style={{ color: 'var(--grey-300)' }}>
              Employer deposits monthly payroll pool into a non-custodial Soroban smart contract vault.
            </p>
          </div>

          <div className="df-cell grid-3-cell slide-up" style={{ animationDelay: '0.3s' }}>
            <span className="label" style={{ color: 'var(--theme-accent)' }}>02 / YIELD ROUTE</span>
            <h3 style={{ marginTop: 'var(--spacer-16)', marginBottom: 'var(--spacer-8)' }}>Auto-Harvest</h3>
            <p style={{ color: 'var(--grey-300)' }}>
              Idle balances are continuously routed into DeFindex & Blend protocols to generate native yield.
            </p>
          </div>

          <div className="df-cell grid-3-cell slide-up" style={{ animationDelay: '0.4s' }}>
            <span className="label" style={{ color: 'var(--theme-accent)' }}>03 / STREAM & WITHDRAW</span>
            <h3 style={{ marginTop: 'var(--spacer-16)', marginBottom: 'var(--spacer-8)' }}>Instant Access</h3>
            <p style={{ color: 'var(--grey-300)' }}>
              Workers stream pay per-second and withdraw to their wallet or bank account at any time.
            </p>
          </div>
        </div>
      </section>

      {/* 03 — INTEGRATIONS */}
      <section className="section-block">
        <SectionHeader
          index="03"
          eyebrow="ECOSYSTEM"
          thesis="Built on battle-tested Stellar primitives."
          paragraph="Deep protocol integrations with Stellar ecosystem infrastructure."
        />
        <div className="df-grid" style={{ marginTop: 'var(--spacer-24)' }}>
          {integrations.map((item, idx) => (
            <div
              key={item.name}
              className="df-cell grid-6-cell slide-up"
              style={{ animationDelay: `${0.1 * (idx + 1)}s`, justifyContent: 'space-between', minHeight: '140px' }}
            >
              <h3 style={{ fontSize: '20px' }}>{item.name}</h3>
              <span className="label" style={{ color: 'var(--theme-accent)', marginTop: 'var(--spacer-16)' }}>
                {item.category}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 04 — FOOTER */}
      <footer className="section-block" style={{ paddingBottom: 0 }}>
        <SectionHeader
          index="04"
          eyebrow="SITEMAP"
          thesis="YieldFlow Protocol"
        />
        <div className="footer-sitemap slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="footer-col">
            <h4>Sections</h4>
            <ul>
              <li onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>About</li>
              <li onClick={() => onNavigate('employer')}>Employer Vault</li>
              <li onClick={() => onNavigate('employee')}>Employee Streaming</li>
              <li onClick={() => onNavigate('approvals')}>Approvals Management</li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Connect</h4>
            <ul>
              <li>Stellar Hub</li>
              <li>Soroban Docs</li>
              <li>GitHub Repository</li>
              <li>Developer Discord</li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Legal & Architecture</h4>
            <ul>
              <li>Non-Custodial Disclaimer</li>
              <li>Audit Report (OpenZeppelin)</li>
              <li>Terms of Service</li>
              <li>Privacy Policy</li>
            </ul>
          </div>
        </div>

        <div className="footer-wordmark slide-up" style={{ animationDelay: '0.3s' }}>
          <h1>YF</h1>
        </div>
      </footer>
    </>
  );
}
