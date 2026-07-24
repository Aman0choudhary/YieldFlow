import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import Lenis from '@studio-freight/lenis';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { Background } from './Background';
import { MenuOverlay } from './MenuOverlay';

gsap.registerPlugin(ScrollTrigger);

export function Layout({ 
  children, 
  currentView,
  onNavigate 
}: { 
  children: ReactNode, 
  currentView: string,
  onNavigate: (view: any) => void 
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // 1. Setup Smooth Scrolling (Lenis)
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    // 2. Sync GSAP with Lenis
    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0, 0);

    // 3. Setup global GSAP ScrollTrigger for slide-up elements
    const ctx = gsap.context(() => {
      const slideUpElements = gsap.utils.toArray('.slide-up') as HTMLElement[];
      slideUpElements.forEach((el) => {
        el.style.animation = 'none';
        el.style.opacity = '0';
        el.style.transform = 'translateY(40px)';

        gsap.to(el, {
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            toggleActions: "play none none none"
          },
          y: 0,
          opacity: 1,
          duration: 1.2,
          ease: "expo.out",
          delay: el.style.animationDelay ? parseFloat(el.style.animationDelay) : 0
        });
      });
    }, containerRef);

    return () => {
      lenis.destroy();
      ctx.revert();
      gsap.ticker.remove((time) => lenis.raf(time * 1000));
    };
  }, [currentView]);

  return (
    <div className="app-container" ref={containerRef}>
      <Background />

      <MenuOverlay
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onNavigate={onNavigate}
        currentView={currentView}
      />

      {/* FIXED PINNED TOP HEADER */}
      <header className="site-header">
        {/* Left: Perfectly aligned logo icon + YieldFlow title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div 
            className="logo text-gradient" 
            style={{ 
              cursor: 'pointer', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '12px' 
            }}
            onClick={() => onNavigate('login')}
          >
            <img 
              src="/logo.svg" 
              alt="YieldFlow Logo" 
              style={{ 
                height: '32px', 
                width: '32px', 
                display: 'block', 
                objectFit: 'contain',
                flexShrink: 0 
              }} 
            />
            <span style={{ 
              fontSize: '24px', 
              fontWeight: 700, 
              letterSpacing: '-0.03em', 
              lineHeight: 1,
              display: 'inline-block'
            }}>
              YieldFlow
            </span>
          </div>
          {currentView !== 'login' && (
            <button 
              className="btn btn-outline"
              style={{ 
                padding: '4px 12px', 
                fontSize: '11px',
                fontFamily: 'NON Natural Mono',
                letterSpacing: '0.06em'
              }}
              onClick={() => onNavigate('login')}
            >
              ← BACK HOME
            </button>
          )}
        </div>

        {/* Center: Dragonfly Unified Square Trigger Box (>|<  :::::  MENU) */}
        <div 
          className="header-center-trigger"
          style={{ 
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: '24px',
            backgroundColor: '#07090b',
            padding: '8px 18px',
            border: '1px solid var(--grey-200)',
            borderRadius: '0px',
            minWidth: '280px'
          }}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span style={{ fontFamily: 'NON Natural Mono', fontSize: '13px', letterSpacing: '0.1em' }}>{'>|<'}</span>

          <div style={{ display: 'flex', gap: '4px' }}>
            <span style={{ width: '5px', height: '5px', backgroundColor: 'var(--orange)', display: 'inline-block' }} />
            <span style={{ width: '5px', height: '5px', backgroundColor: 'var(--orange)', display: 'inline-block' }} />
            <span style={{ width: '5px', height: '5px', backgroundColor: 'var(--orange)', display: 'inline-block' }} />
            <span style={{ width: '5px', height: '5px', backgroundColor: 'var(--orange)', display: 'inline-block' }} />
            <span style={{ width: '5px', height: '5px', backgroundColor: 'var(--orange)', display: 'inline-block' }} />
          </div>

          <span style={{ 
            fontFamily: 'NON Natural Mono',
            fontWeight: 700, 
            fontSize: '12px',
            letterSpacing: '0.08em',
            color: isMenuOpen ? 'var(--theme-accent)' : 'var(--theme-fg)'
          }}>
            {isMenuOpen ? 'CLOSE [✕]' : 'MENU'}
          </span>
        </div>
        
        {/* Right: Navigation actions */}
        <div className="site-nav">
          <div className="nav-grid" style={{ alignItems: 'center' }}>
            <div className="nav-item">
              <span style={{ 
                fontFamily: 'NON Natural Mono',
                fontSize: '11px',
                color: 'var(--grey-300)',
                letterSpacing: '0.06em'
              }}>
                BUILT ON STELLAR
              </span>
            </div>
          </div>
        </div>
      </header>

      <main>
        {children}
      </main>
    </div>
  );
}
