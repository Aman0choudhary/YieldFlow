import { useState } from 'react';
import { Modal } from './Modal';

interface MenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  currentView: string;
}

export function MenuOverlay({ isOpen, onClose, onNavigate }: MenuOverlayProps) {
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);

  if (!isOpen && !showAboutModal && !showContractModal) return null;

  const menuItems = [
    { index: '01', label: 'ABOUT YIELDFLOW', action: () => setShowAboutModal(true) },
    { index: '02', label: 'LANDING & MECHANICS', view: 'login' },
    { index: '03', label: 'EMPLOYER TREASURY VAULT', view: 'employer' },
    { index: '04', label: 'EMPLOYEE STREAMING PORTAL', view: 'employee' },
    { index: '05', label: 'APPROVALS & AUTHORIZATIONS', view: 'approvals' },
    { index: '06', label: 'ADMIN CONSOLE', view: 'admin' },
  ];

  const handleSelect = (item: typeof menuItems[0]) => {
    if (item.action) {
      item.action();
    } else if (item.view) {
      onNavigate(item.view);
      onClose();
    }
  };

  return (
    <>
      {isOpen && (
        <>
          {/* Dim backdrop */}
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 550
            }}
            onClick={onClose}
          />

          {/* Center Drawer Panel (Dragonfly UI match) */}
          <div
            className="menu-drawer-panel fade-in"
            style={{
              position: 'fixed',
              top: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'min(620px, 94vw)',
              backgroundColor: '#07090b',
              border: '1px solid var(--grey-200)',
              borderRadius: '0px',
              zIndex: 600,
              boxShadow: '0 20px 60px rgba(0,0,0,0.95), 0 0 30px rgba(45, 212, 168, 0.1)',
              overflow: 'hidden'
            }}
          >
            {/* Header inside drawer */}
            <div 
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 24px',
                borderBottom: '1px solid var(--grey-100)',
                backgroundColor: '#07090b'
              }}
            >
              <div style={{ fontFamily: 'NON Natural Mono', fontSize: '14px', letterSpacing: '0.1em', color: 'var(--theme-fg)' }}>
                {'>|<'}
              </div>

              <div style={{ display: 'flex', gap: '4px' }}>
                <span style={{ width: '5px', height: '5px', backgroundColor: 'var(--orange)', display: 'inline-block' }} />
                <span style={{ width: '5px', height: '5px', backgroundColor: 'var(--orange)', display: 'inline-block' }} />
                <span style={{ width: '5px', height: '5px', backgroundColor: 'var(--orange)', display: 'inline-block' }} />
                <span style={{ width: '5px', height: '5px', backgroundColor: 'var(--orange)', display: 'inline-block' }} />
                <span style={{ width: '5px', height: '5px', backgroundColor: 'var(--orange)', display: 'inline-block' }} />
              </div>

              <button 
                className="label"
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--theme-accent)', 
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontFamily: 'NON Natural Mono',
                  fontWeight: 700,
                  letterSpacing: '0.08em'
                }}
                onClick={onClose}
              >
                CLOSE [X]
              </button>
            </div>

            {/* Menu Items */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {menuItems.map((item) => (
                <div
                  key={item.index}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 1fr',
                    alignItems: 'center',
                    padding: 'var(--spacer-16) var(--spacer-24)',
                    borderBottom: '1px solid var(--grey-100)',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  className="menu-row-item"
                  onClick={() => handleSelect(item)}
                >
                  <span className="label" style={{ color: 'var(--grey-300)', fontSize: '12px' }}>
                    {item.index}
                  </span>
                  <span 
                    style={{
                      fontFamily: 'NON Natural Grotesk',
                      fontSize: '18px',
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase'
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {/* ASCII Matrix Art / Protocol Statement */}
            <div 
              style={{
                padding: 'var(--spacer-24)',
                borderBottom: '1px solid var(--grey-100)',
                fontFamily: 'NON Natural Mono',
                fontSize: '11px',
                color: 'var(--grey-300)',
                lineHeight: 1.6,
                letterSpacing: '0.15em',
                userSelect: 'none',
                overflow: 'hidden'
              }}
            >
              <div>Y I E L D F L O W . P R O T O C O L . S T E L L A R</div>
              <div>R E A L - T I M E . P A Y R O L L . S T R E A M S</div>
              <div>A U T O M A T E D . B L E N D . Y I E L D . V A U L T S</div>
              <div>N O N - C U S T O D I A L . S O R O B A N . A U T H</div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--grey-100)' }}>
              <button 
                className="label"
                style={{
                  padding: 'var(--spacer-16)',
                  background: 'none',
                  border: 'none',
                  borderRight: '1px solid var(--grey-100)',
                  color: 'var(--theme-fg)',
                  cursor: 'pointer',
                  transition: 'color 0.2s, background 0.2s'
                }}
                onClick={() => setShowAboutModal(true)}
              >
                ABOUT PRODUCT
              </button>
              <button 
                className="label"
                style={{
                  padding: 'var(--spacer-16)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--theme-fg)',
                  cursor: 'pointer',
                  transition: 'color 0.2s, background 0.2s'
                }}
                onClick={() => setShowContractModal(true)}
              >
                CONTRACT INFO
              </button>
            </div>

            {/* Colored Bottom Bar (matching Dragonfly screenshot) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', height: '16px' }}>
              <div style={{ backgroundColor: 'var(--orange)' }} />
              <div style={{ backgroundColor: 'var(--pink)' }} />
              <div style={{ backgroundColor: 'var(--purple)' }} />
            </div>
          </div>
        </>
      )}

      {/* ABOUT PRODUCT MODAL */}
      <Modal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        title="Real-Time Payroll + Automated Yield"
        eyebrow="ABOUT YIELDFLOW"
      >
        <p style={{ color: 'var(--grey-300)', lineHeight: 1.6 }}>
          YieldFlow eliminates treasury cash drag by routing committed payroll pools directly into Stellar money markets (DeFindex & Blend) on Soroban until the exact second employees stream their earned wages.
        </p>

        <div style={{ marginTop: 'var(--spacer-24)', display: 'flex', flexDirection: 'column', gap: 'var(--spacer-16)' }}>
          <div style={{ borderLeft: '2px solid var(--theme-accent)', paddingLeft: 'var(--spacer-12)' }}>
            <strong style={{ display: 'block', fontSize: '14px', color: 'var(--theme-fg)' }}>01 / Zero Idle Capital</strong>
            <span style={{ fontSize: '13px', color: 'var(--grey-300)' }}>Employers earn interest on committed salary funds right up to withdrawal.</span>
          </div>
          <div style={{ borderLeft: '2px solid var(--theme-accent)', paddingLeft: 'var(--spacer-12)' }}>
            <strong style={{ display: 'block', fontSize: '14px', color: 'var(--theme-fg)' }}>02 / Per-Second Streaming</strong>
            <span style={{ fontSize: '13px', color: 'var(--grey-300)' }}>Employees stream pay live and withdraw 24/7 without waiting for bi-weekly payday.</span>
          </div>
          <div style={{ borderLeft: '2px solid var(--theme-accent)', paddingLeft: 'var(--spacer-12)' }}>
            <strong style={{ display: 'block', fontSize: '14px', color: 'var(--theme-fg)' }}>03 / Passkey Biometrics</strong>
            <span style={{ fontSize: '13px', color: 'var(--grey-300)' }}>Secured by hardware enclave FaceID / TouchID via Soroban Passkey Kit.</span>
          </div>
        </div>

        <div style={{ marginTop: 'var(--spacer-32)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn" onClick={() => setShowAboutModal(false)}>
            Close & Explore
          </button>
        </div>
      </Modal>

      {/* CONTRACT INFO MODAL */}
      <Modal
        isOpen={showContractModal}
        onClose={() => setShowContractModal(false)}
        title="Soroban Smart Contract Specs"
        eyebrow="ON-CHAIN ADDRESSES"
      >
        <p style={{ color: 'var(--grey-300)', lineHeight: 1.6, marginBottom: 'var(--spacer-20)' }}>
          YieldFlow contracts are deployed on Stellar Testnet and integrated with Soroban RPC nodes for real-time state synchronization.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacer-12)', fontFamily: 'NON Natural Mono', fontSize: '12px' }}>
          <div style={{ padding: 'var(--spacer-12)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--grey-100)' }}>
            <span className="label" style={{ color: 'var(--grey-300)', display: 'block', marginBottom: '4px' }}>STREAMING PAYROLL VAULT</span>
            <code style={{ color: 'var(--theme-accent)', wordBreak: 'break-all' }}>C...82K9 (Testnet Soroban Contract)</code>
          </div>
          <div style={{ padding: 'var(--spacer-12)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--grey-100)' }}>
            <span className="label" style={{ color: 'var(--grey-300)', display: 'block', marginBottom: '4px' }}>YIELD ROUTER (BLEND / DEFINDEX)</span>
            <code style={{ color: 'var(--orange)', wordBreak: 'break-all' }}>C...91X4 (Money Market Strategy)</code>
          </div>
          <div style={{ padding: 'var(--spacer-12)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--grey-100)' }}>
            <span className="label" style={{ color: 'var(--grey-300)', display: 'block', marginBottom: '4px' }}>PASSKEY KEYPAIR RELAYER</span>
            <code style={{ color: 'var(--pink)', wordBreak: 'break-all' }}>GB...77W2 (OpenZeppelin Relayer)</code>
          </div>
        </div>

        <div style={{ marginTop: 'var(--spacer-32)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={() => setShowContractModal(false)}>
            Close
          </button>
        </div>
      </Modal>
    </>
  );
}
