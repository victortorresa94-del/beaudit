/* "From Microsoft 365 to actionable assurance." — clean grid layout, no absolute overlap. */

function MicrosoftLogo({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <rect x="2" y="2" width="9.5" height="9.5" fill="#F25022"/>
      <rect x="12.5" y="2" width="9.5" height="9.5" fill="#7FBA00"/>
      <rect x="2" y="12.5" width="9.5" height="9.5" fill="#00A4EF"/>
      <rect x="12.5" y="12.5" width="9.5" height="9.5" fill="#FFB900"/>
    </svg>
  );
}

function ScoreRing({ score = 68, size = 88, stroke = 8 }) {
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
      <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle"
        style={{ font: `800 ${Math.round(size*0.22)}px var(--bes-font-display)`, fill: '#001A41', letterSpacing: '-0.03em' }}>
        {score}
      </text>
      <text x="50%" y="68%" textAnchor="middle"
        style={{ font: `600 ${Math.round(size*0.11)}px var(--bes-font-body)`, fill: '#9CA3AF' }}>
        /100
      </text>
    </svg>
  );
}

function RisksMockup() {
  const rows = [
    ['External users with broad access', '172 users', 'High', '#FEE2E2', '#DC2626'],
    ['Global admin accounts without MFA', '3 accounts', 'High', '#FEE2E2', '#DC2626'],
    ['Email forwarding to external domains', '7 rules', 'Medium', '#FEF3C7', '#B45309'],
    ['Unmanaged device sign-ins', '28 sign-ins', 'Low', '#DBEAFE', '#1D4ED8'],
  ];
  return (
    <div style={{
      display: 'flex', borderRadius: 14, overflow: 'hidden',
      boxShadow: '0 20px 48px rgba(0,26,65,0.10), 0 4px 10px rgba(0,26,65,0.04)',
      background: '#fff',
    }}>
      {/* mini rail */}
      <div style={{
        width: 48, background: '#0A1A33',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '14px 0 12px', gap: 5, flexShrink: 0,
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: 6, background: '#0075F2',
          display: 'grid', placeItems: 'center',
          font: '800 13px var(--bes-font-display)', color: '#fff', marginBottom: 8,
        }}>B</div>
        {[0,1,2,3,4,5].map(i => (
          <div key={i} style={{
            width: 28, height: 28, borderRadius: 6,
            background: i === 0 ? 'rgba(255,255,255,0.10)' : 'transparent',
            display: 'grid', placeItems: 'center',
            color: i === 0 ? '#fff' : 'rgba(255,255,255,0.30)',
          }}>
            <div style={{ width: 11, height: 11, border: '1.5px solid currentColor', borderRadius: 2 }}/>
          </div>
        ))}
      </div>
      {/* main content */}
      <div style={{ flex: 1, padding: '14px 14px 16px', display: 'flex', gap: 12, minWidth: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <div style={{ font: '700 11.5px var(--bes-font-display)', color: '#001A41' }}>Top security risks</div>
            <div style={{ font: '600 10px var(--bes-font-body)', color: '#0075F2', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              View all risks
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </div>
          </div>
          {rows.map(([title, n, sev, sevBg, sevFg], i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0',
              borderTop: i === 0 ? 'none' : '1px solid rgba(0,26,65,0.05)',
            }}>
              <div style={{ width: 20, height: 20, borderRadius: 5, background: '#F3F4F6', display: 'grid', placeItems: 'center', color: '#9CA3AF', flexShrink: 0 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
              </div>
              <div style={{ font: '500 10px var(--bes-font-body)', color: '#001A41', flex: 1, lineHeight: 1.3, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
              <div style={{ font: '500 9.5px var(--bes-font-body)', color: '#9CA3AF', flexShrink: 0 }}>{n}</div>
              <div style={{ font: '700 9px var(--bes-font-display)', color: sevFg, background: sevBg, padding: '2px 7px', borderRadius: 3, flexShrink: 0 }}>{sev}</div>
            </div>
          ))}
        </div>
        {/* risk score right */}
        <div style={{
          width: 130, paddingLeft: 12, borderLeft: '1px solid rgba(0,26,65,0.06)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0,
        }}>
          <ScoreRing score={68} size={88} stroke={7}/>
          <div style={{ font: '500 9px var(--bes-font-body)', color: '#9CA3AF', marginTop: 2 }}>Risk score over time</div>
          <svg viewBox="0 0 120 36" width="100%" height="36">
            <defs>
              <linearGradient id="rFill2" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#0075F2" stopOpacity="0.15"/>
                <stop offset="100%" stopColor="#0075F2" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <path d="M0 8 L20 12 L40 10 L60 20 L80 26 L100 22 L120 28 L120 36 L0 36Z" fill="url(#rFill2)"/>
            <path d="M0 8 L20 12 L40 10 L60 20 L80 26 L100 22 L120 28"
              fill="none" stroke="#0075F2" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', font: '500 8px var(--bes-font-body)', color: '#9CA3AF' }}>
            <span>May 5</span><span>Jun 2</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConnectM365Card() {
  return (
    <div style={{
      background: '#fff', borderRadius: 14,
      border: '1px solid rgba(0,26,65,0.07)',
      boxShadow: '0 14px 36px rgba(0,26,65,0.10)',
      padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ font: '700 12.5px var(--bes-font-display)', color: '#001A41' }}>Connect Microsoft 365</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 999, background: '#DCFCE7', color: '#15803D', font: '700 9.5px var(--bes-font-display)' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22C55E' }}/>Connected
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10, borderBottom: '1px solid rgba(0,26,65,0.06)' }}>
        <MicrosoftLogo size={22}/>
        <div>
          <div style={{ font: '700 11.5px var(--bes-font-display)', color: '#001A41' }}>beservices.es</div>
          <div style={{ font: '500 10px var(--bes-font-body)', color: '#9CA3AF' }}>Microsoft 365 Business Premium</div>
        </div>
      </div>
      <div style={{ marginTop: 10, padding: '9px 11px', background: '#F0F9FF', borderRadius: 9, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 22, height: 22, borderRadius: 5, background: '#fff', display: 'grid', placeItems: 'center', color: '#0075F2', boxShadow: '0 1px 3px rgba(0,26,65,0.08)', flexShrink: 0 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ font: '700 11px var(--bes-font-display)', color: '#001A41' }}>Read-only access</div>
          <div style={{ font: '500 9.5px var(--bes-font-body)', color: '#4B5563' }}>We never change your configuration</div>
        </div>
        <button style={{ padding: '5px 11px', borderRadius: 7, border: '1px solid #0075F2', background: '#fff', font: '700 10px var(--bes-font-display)', color: '#0075F2', cursor: 'pointer', flexShrink: 0 }}>View connection</button>
      </div>
    </div>
  );
}

function RecommendedCard() {
  return (
    <div style={{
      background: '#fff', borderRadius: 14,
      border: '1px solid rgba(0,26,65,0.07)',
      boxShadow: '0 14px 36px rgba(0,26,65,0.10)',
      padding: '14px 16px',
    }}>
      <div style={{ font: '600 10px var(--bes-font-body)', color: '#9CA3AF', marginBottom: 8 }}>Recommended</div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: '#001A41', display: 'grid', placeItems: 'center', color: '#fff', flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ font: '700 12.5px var(--bes-font-display)', color: '#001A41', marginBottom: 5, lineHeight: 1.3 }}>Require MFA for all admin accounts</div>
          <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
            <span style={{ padding: '2px 7px', borderRadius: 4, background: '#FEE2E2', color: '#DC2626', font: '700 9px var(--bes-font-display)' }}>High impact</span>
            <span style={{ padding: '2px 7px', borderRadius: 4, background: '#DCFCE7', color: '#15803D', font: '700 9px var(--bes-font-display)' }}>Easy to fix</span>
          </div>
          <div style={{ font: '400 10.5px/1.45 var(--bes-font-body)', color: '#4B5563' }}>Reduce the risk of account compromise in your organization.</div>
        </div>
      </div>
      <button style={{ marginTop: 11, width: '100%', padding: '9px 12px', borderRadius: 8, border: 'none', background: '#0075F2', color: '#fff', font: '700 11.5px var(--bes-font-display)', cursor: 'pointer' }}>View how to fix</button>
    </div>
  );
}

function ReportCard() {
  return (
    <div style={{
      background: '#fff', borderRadius: 14,
      border: '1px solid rgba(0,26,65,0.07)',
      boxShadow: '0 14px 36px rgba(0,26,65,0.10)',
      padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
        <div style={{ width: 36, height: 42, borderRadius: 5, background: '#fff', border: '1.5px solid #0075F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0075F2" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
            <div style={{ font: '700 12.5px var(--bes-font-display)', color: '#001A41', lineHeight: 1.3 }}>Executive report — June 2024</div>
            <div style={{ padding: '2px 8px', borderRadius: 999, background: '#DCFCE7', color: '#15803D', font: '700 9px var(--bes-font-display)', flexShrink: 0 }}>Ready</div>
          </div>
          <div style={{ font: '500 10.5px var(--bes-font-body)', color: '#9CA3AF', marginTop: 3 }}>Generated on Jun 2, 2024</div>
          <div style={{ font: '500 10.5px var(--bes-font-body)', color: '#9CA3AF' }}>PDF · 24 pages</div>
        </div>
      </div>
      <button style={{ marginTop: 11, width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(0,26,65,0.10)', background: '#fff', color: '#001A41', font: '700 11.5px var(--bes-font-display)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
        Download report
      </button>
    </div>
  );
}

/* Step indicator with connecting dashed line */
function StepIndicator({ n, isLast = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 28 }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        border: '1.5px solid #0075F2',
        display: 'grid', placeItems: 'center',
        font: '700 11px var(--bes-font-display)', color: '#0075F2',
        background: '#fff', zIndex: 1, flexShrink: 0,
      }}>{n}</div>
      {!isLast && (
        <div style={{
          width: 0, flex: 1, minHeight: 32,
          borderLeft: '1.5px dashed rgba(0,117,242,0.25)',
          marginTop: 4, marginBottom: 4,
        }}/>
      )}
    </div>
  );
}

/* A step row: indicator | text block | optional side card */
function StepRow({ n, title, body, card, isLast = false }) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <StepIndicator n={n} isLast={isLast}/>
      <div style={{ display: 'grid', gridTemplateColumns: card ? '1fr 1fr' : '1fr', gap: 24, flex: 1, paddingTop: 2, paddingBottom: isLast ? 0 : 40 }}>
        <div>
          <h3 style={{
            font: '800 20px/1.2 var(--bes-font-display)',
            color: '#001A41', letterSpacing: '-0.02em', margin: '0 0 8px',
          }}>{title}</h3>
          <p style={{
            font: '400 13.5px/1.55 var(--bes-font-body)',
            color: '#4B5563', margin: 0, textWrap: 'pretty',
          }}>{body}</p>
        </div>
        {card && <div>{card}</div>}
      </div>
    </div>
  );
}

function WhatItDoes() {
  return (
    <section id="how" style={{
      position: 'relative', background: '#fff', padding: '96px 48px 110px',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Two-column header: left=headline, right=steps */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 72, alignItems: 'flex-start' }}>
          {/* LEFT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#0075F2' }}/>
              <span style={{ font: '700 11px var(--bes-font-body)', color: '#0075F2', letterSpacing: '0.22em', textTransform: 'uppercase' }}>
                What BeAudit does
              </span>
            </div>
            <h2 style={{
              font: '800 clamp(2rem, 3.4vw, 3rem)/1.07 var(--bes-font-display)',
              letterSpacing: '-0.03em', color: '#001A41', margin: '0 0 18px',
            }}>
              From Microsoft 365<br/>
              to <span style={{ color: '#0075F2' }}>actionable</span> assurance.
            </h2>
            <p style={{
              font: '400 15px/1.6 var(--bes-font-body)', color: '#4B5563',
              margin: '0 0 40px', textWrap: 'pretty',
            }}>
              BeAudit continuously analyzes your Microsoft 365 environment,
              finds what matters, and shows you exactly what to fix.
            </p>

            {/* Product mockup left column */}
            <RisksMockup/>
          </div>

          {/* RIGHT — 4 steps with connecting dashes */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <StepRow
              n="01"
              title="Connect in minutes. Read-only. Always."
              body="Secure, read-only connection to your Microsoft 365 tenant. No agents. No impact."
              card={<ConnectM365Card/>}
            />
            <StepRow
              n="02"
              title="We find what others miss."
              body="Hundreds of checks across identity, data, devices, and configurations. Mapped to real business impact."
            />
            <StepRow
              n="03"
              title="Prioritized by risk. Explained in business."
              body="Clear risk score, business context, and step-by-step guidance for your team or your partner."
              card={<RecommendedCard/>}
            />
            <StepRow
              n="04"
              title="Fix, verify, and prove it."
              body="Track improvement over time and generate audit-ready reports in one click."
              card={<ReportCard/>}
              isLast={true}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { WhatItDoes });
