/* BeAudit Hero — left: headline. right: product dashboard mockup. */

function ScoreRing({ score = 92, size = 138, stroke = 11 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = score / 100;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} stroke="#E5E7EB" strokeWidth={stroke} fill="none"/>
      <circle cx={size/2} cy={size/2} r={r}
        stroke="#0075F2" strokeWidth={stroke} fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        transform={`rotate(-90 ${size/2} ${size/2})`}/>
      <text x="50%" y="48%" textAnchor="middle"
        style={{ font: '800 32px var(--bes-font-display)', fill: '#001A41', letterSpacing: '-0.03em' }}>
        {score}
      </text>
      <text x="50%" y="64%" textAnchor="middle"
        style={{ font: '600 11px var(--bes-font-body)', fill: '#9CA3AF' }}>
        /100
      </text>
    </svg>
  );
}

/* Left vertical app rail (dark) */
function AppRail({ items }) {
  return (
    <div style={{
      width: 56, background: '#0A1A33',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '18px 0 14px', gap: 6,
      borderTopLeftRadius: 16, borderBottomLeftRadius: 16,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, background: '#0075F2',
        display: 'grid', placeItems: 'center',
        font: '800 16px var(--bes-font-display)', color: '#fff', marginBottom: 8,
      }}>B</div>
      {items.map((p, i) => (
        <div key={i} style={{
          width: 38, height: 38, borderRadius: 8,
          display: 'grid', placeItems: 'center',
          color: i === 0 ? '#fff' : 'rgba(255,255,255,0.45)',
          background: i === 0 ? 'rgba(255,255,255,0.08)' : 'transparent',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {p}
          </svg>
        </div>
      ))}
    </div>
  );
}

const RAIL_ICONS = [
  <g key="grid"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></g>,
  <path key="shield" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
  <g key="check"><circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/></g>,
  <g key="doc"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></g>,
  <g key="list"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></g>,
  <g key="cog"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8 2 2 0 1 1-2.8 2.8 1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5 2 2 0 1 1-4 0 1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3 2 2 0 1 1-2.8-2.8 1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1 2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8 2 2 0 1 1 2.8-2.8 1.7 1.7 0 0 0 1.8.3 1.7 1.7 0 0 0 1-1.5 2 2 0 1 1 4 0 1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3 2 2 0 1 1 2.8 2.8 1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1 2 2 0 1 1 0 4 1.7 1.7 0 0 0-1.5 1z"/></g>,
  <g key="user"><circle cx="12" cy="8" r="4"/><path d="M4 22a8 8 0 0 1 16 0"/></g>,
];

function HeroDashboard() {
  return (
    <div style={{
      position: 'relative', width: '100%',
      borderRadius: 16,
      boxShadow: '0 30px 70px rgba(0,26,65,0.14), 0 8px 20px rgba(0,26,65,0.06)',
      background: '#fff', display: 'flex',
      overflow: 'visible',
    }}>
      <AppRail items={RAIL_ICONS}/>

      {/* Main panel */}
      <div style={{
        flex: 1, background: '#fff',
        borderTopRightRadius: 16, borderBottomRightRadius: 16,
        padding: '20px 22px 22px',
      }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ font: '700 15px var(--bes-font-display)', color: '#001A41', letterSpacing: '-0.01em' }}>
            Executive overview
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 8,
            border: '1px solid rgba(0,26,65,0.10)',
            font: '500 12px var(--bes-font-body)', color: '#4B5563',
          }}>
            Last 30 days
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </div>
        </div>

        {/* Two cards row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.35fr', gap: 12 }}>
          {/* Security posture */}
          <div style={{
            border: '1px solid rgba(0,26,65,0.08)', borderRadius: 12,
            padding: '14px 16px',
          }}>
            <div style={{ font: '600 11px var(--bes-font-body)', color: '#4B5563', marginBottom: 4 }}>
              Security posture
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
              <ScoreRing score={92} size={132} stroke={10}/>
            </div>
            <div style={{
              textAlign: 'center', font: '700 11px var(--bes-font-display)',
              color: '#10B981', marginTop: -2,
            }}>Excellent</div>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              font: '500 10px var(--bes-font-body)', color: '#10B981', marginTop: 6,
            }}>
              <span>↑ 8 pts vs last 30 days</span>
            </div>
          </div>

          {/* Control coverage */}
          <div style={{
            border: '1px solid rgba(0,26,65,0.08)', borderRadius: 12,
            padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ font: '600 11px var(--bes-font-body)', color: '#4B5563' }}>
                Control coverage
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
              <div style={{ font: '800 26px var(--bes-font-display)', color: '#001A41', letterSpacing: '-0.025em' }}>837</div>
              <div style={{ font: '500 13px var(--bes-font-body)', color: '#9CA3AF' }}>/ 902</div>
              <div style={{ marginLeft: 'auto', font: '700 11px var(--bes-font-body)', color: '#10B981' }}>93%</div>
            </div>
            {/* progress bar */}
            <div style={{
              height: 5, background: '#F3F4F6', borderRadius: 999, marginTop: 8, overflow: 'hidden',
            }}>
              <div style={{ width: '93%', height: '100%', background: '#0075F2', borderRadius: 999 }}/>
            </div>
            {/* breakdown */}
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[
                ['#0075F2', 'Implemented', 837],
                ['#50CABF', 'In progress', 40],
                ['#E5E7EB', 'Not implemented', 25],
              ].map(([c, l, n]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, font: '500 10.5px var(--bes-font-body)' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: c }}/>
                  <span style={{ color: '#4B5563', flex: 1 }}>{l}</span>
                  <span style={{ color: '#001A41', fontWeight: 600 }}>{n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Risks over time */}
        <div style={{
          marginTop: 12, border: '1px solid rgba(0,26,65,0.08)', borderRadius: 12,
          padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ font: '600 11px var(--bes-font-body)', color: '#4B5563' }}>Risks over time</div>
            <div style={{ font: '700 11px var(--bes-font-display)', color: '#10B981' }}>↓ 35%
              <span style={{ font: '400 10px var(--bes-font-body)', color: '#9CA3AF', marginLeft: 4 }}>vs last 30 days</span>
            </div>
          </div>
          {/* mini chart */}
          <div style={{ position: 'relative', height: 78, marginTop: 10 }}>
            <svg viewBox="0 0 360 80" width="100%" height="100%" preserveAspectRatio="none">
              <defs>
                <linearGradient id="riskFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#0075F2" stopOpacity="0.18"/>
                  <stop offset="100%" stopColor="#0075F2" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path d="M0 18 L40 14 L80 22 L120 28 L160 34 L200 42 L240 52 L280 60 L320 64 L360 66 L360 80 L0 80 Z"
                fill="url(#riskFill)"/>
              <path d="M0 18 L40 14 L80 22 L120 28 L160 34 L200 42 L240 52 L280 60 L320 64 L360 66"
                fill="none" stroke="#0075F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {/* Y axis labels */}
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              font: '500 9px var(--bes-font-body)', color: '#9CA3AF', paddingRight: 6,
            }}>
              <span>High</span><span>Medium</span><span>Low</span>
            </div>
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            font: '500 9.5px var(--bes-font-body)', color: '#9CA3AF', marginTop: 4, paddingLeft: 24,
          }}>
            <span>May 5</span><span>May 12</span><span>May 19</span><span>May 26</span><span>Jun 2</span>
          </div>
        </div>
      </div>

      {/* Floating Frameworks card */}
      <div style={{
        position: 'absolute', right: -36, bottom: -34,
        width: 250, padding: '14px 16px',
        background: '#fff',
        borderRadius: 14, border: '1px solid rgba(0,26,65,0.06)',
        boxShadow: '0 18px 40px rgba(0,26,65,0.12)',
      }}>
        <div style={{ font: '700 12px var(--bes-font-display)', color: '#001A41', marginBottom: 10 }}>Frameworks</div>
        {[
          ['ISO 27001', 93, '#0075F2'],
          ['SOC 2 Type II', 91, '#0075F2'],
          ['NIS2', 88, '#0075F2'],
          ['GDPR', 95, '#0075F2'],
        ].map(([n, p, c]) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
            <span style={{
              width: 18, height: 18, borderRadius: 4, background: '#E0F2FE',
              display: 'grid', placeItems: 'center', color: '#0075F2',
              font: '800 9px var(--bes-font-display)',
            }}>✓</span>
            <span style={{ font: '600 11px var(--bes-font-body)', color: '#001A41', flex: 1 }}>{n}</span>
            <span style={{ font: '700 11px var(--bes-font-display)', color: '#0075F2' }}>{p}%</span>
          </div>
        ))}
        <div style={{
          marginTop: 6, paddingTop: 8, borderTop: '1px solid rgba(0,26,65,0.06)',
          font: '600 11px var(--bes-font-body)', color: '#0075F2',
          display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer',
        }}>
          View all frameworks
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </div>
      </div>
    </div>
  );
}

function BeAuditHero() {
  return (
    <section style={{ position: 'relative', overflow: 'hidden', background: '#fff', padding: '72px 48px 88px' }}>
      {/* faint grid backdrop on the right */}
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: '52%',
        backgroundImage: 'radial-gradient(rgba(0,26,65,0.10) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
        maskImage: 'linear-gradient(to left, black 30%, transparent 90%)',
        WebkitMaskImage: 'linear-gradient(to left, black 30%, transparent 90%)',
        opacity: 0.55,
      }}/>

      <div style={{
        position: 'relative', maxWidth: 1280, margin: '0 auto',
        display: 'grid', gridTemplateColumns: '1fr 1.05fr', gap: 64, alignItems: 'center',
      }}>
        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#0075F2' }}/>
            <span style={{
              font: '700 11px var(--bes-font-body)', color: '#0075F2',
              letterSpacing: '0.22em', textTransform: 'uppercase',
            }}>Built for security. Designed for trust.</span>
          </div>

          <h1 style={{
            font: '800 clamp(2.6rem, 4.6vw, 4rem)/1.05 var(--bes-font-display)',
            letterSpacing: '-0.03em', color: '#001A41', margin: 0,
          }}>
            Continuous Security.<br/>
            Evidence that <span style={{ color: '#0075F2' }}>proves it.</span>
          </h1>

          <p style={{
            font: '400 17px/1.6 var(--bes-font-body)',
            color: '#4B5563', maxWidth: 440, margin: 0, textWrap: 'pretty',
          }}>
            BeAudit automates security audits, validates your controls,
            and delivers continuous assurance across your entire stack.
          </p>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 6 }}>
            <Button variant="primary" size="md" href="BeAudit Platform.html">Request demo</Button>
            <a href="#how" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              font: '600 14px var(--bes-font-body)', color: '#001A41', textDecoration: 'none',
            }}>
              See how it works
              <span style={{
                width: 22, height: 22, borderRadius: '50%',
                border: '1.5px solid #0075F2', color: '#0075F2',
                display: 'inline-grid', placeItems: 'center',
              }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              </span>
            </a>
          </div>
        </div>

        {/* RIGHT — dashboard mockup */}
        <div style={{ position: 'relative', paddingBottom: 36 }}>
          <HeroDashboard/>
        </div>
      </div>

      {/* Trust strip */}
      <div style={{
        position: 'relative', maxWidth: 1280, margin: '72px auto 0',
        textAlign: 'center',
      }}>
        <div style={{
          font: '700 11px var(--bes-font-body)', color: '#9CA3AF',
          letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 28,
        }}>
          Trusted by security-driven companies
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 32,
          alignItems: 'center', maxWidth: 1100, margin: '0 auto',
          color: '#4B5563',
          font: '700 18px var(--bes-font-display)', letterSpacing: '-0.02em',
        }}>
          <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <span style={{ font: '900 22px Inter', color: '#4B5563' }}>‹</span>
            <span style={{ letterSpacing: '0.02em' }}>LUXOFT</span>
          </div>
          <div style={{ textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#4B5563"><polygon points="12,2 14,8 20,8 16,12 18,18 12,14 6,18 8,12 4,8 10,8"/></svg>
            <span>BINANCE</span>
          </div>
          <div style={{ textAlign: 'center', font: '800 19px Inter' }}>amadeus</div>
          <div style={{ textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <span style={{
              width: 22, height: 22, borderRadius: '50%', background: '#4B5563', color: '#fff',
              display: 'inline-grid', placeItems: 'center',
              font: '900 12px Inter',
            }}>iD</span>
            <span>inDrive</span>
          </div>
          <div style={{ textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <span>Glovo</span>
            <span style={{
              width: 14, height: 14, borderRadius: '50%', background: '#FFC107',
              display: 'inline-block', marginLeft: -2, marginTop: 4,
            }}/>
          </div>
          <div style={{ textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span style={{
              width: 18, height: 18, borderRadius: '50%',
              border: '2px solid #4B5563', display: 'inline-block', position: 'relative',
            }}>
              <span style={{
                position: 'absolute', inset: 3, borderLeft: '2px solid #4B5563', borderRadius: '50%',
              }}/>
            </span>
            <span>cronos</span>
          </div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { BeAuditHero });
