import { ReactNode, useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, eyebrow, children }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 'var(--spacer-24)',
      }}
      onClick={onClose}
    >
      <div
        className="fade-in"
        style={{
          position: 'relative',
          width: 'min(620px, 94vw)',
          maxHeight: '90vh',
          backgroundColor: '#07090b',
          border: '1px solid var(--grey-200)',
          borderRadius: '0px',
          boxShadow: '0 24px 90px rgba(0, 0, 0, 0.95), 0 0 30px rgba(45, 212, 168, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 'var(--spacer-16) var(--spacer-24)',
            borderBottom: '1px solid var(--grey-100)',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontFamily: 'NON Natural Mono', fontSize: '13px', letterSpacing: '0.1em', color: 'var(--theme-accent)' }}>
              {'>|<'}
            </span>
            {eyebrow && (
              <span className="label" style={{ color: 'var(--theme-accent)' }}>
                {eyebrow}
              </span>
            )}
          </div>

          <button
            className="label"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--theme-fg)',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'color 0.2s',
            }}
            onClick={onClose}
          >
            CLOSE [✕]
          </button>
        </div>

        {/* Modal Title */}
        <div style={{ padding: 'var(--spacer-24) var(--spacer-24) 0' }}>
          <h2 style={{ fontSize: 'clamp(22px, 4vw, 32px)', textTransform: 'uppercase', letterSpacing: '-0.03em' }}>
            {title}
          </h2>
        </div>

        {/* Modal Content */}
        <div
          style={{
            padding: 'var(--spacer-16) var(--spacer-24) var(--spacer-24)',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {children}
        </div>

        {/* Tri-color Accent Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', height: '4px' }}>
          <div style={{ backgroundColor: 'var(--orange)' }} />
          <div style={{ backgroundColor: 'var(--pink)' }} />
          <div style={{ backgroundColor: 'var(--purple)' }} />
        </div>
      </div>
    </div>
  );
}
