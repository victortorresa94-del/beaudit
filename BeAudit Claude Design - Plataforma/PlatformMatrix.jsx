/* MITRE ATT&CK Matrix view */

const TACTICS = [
  { id: 'recon',   label: 'Reconnaissance',       count: 10 },
  { id: 'resdev',  label: 'Resource Development',  count: 7 },
  { id: 'init',    label: 'Initial Access',         count: 9 },
  { id: 'exec',    label: 'Execution',              count: 10 },
  { id: 'pers',    label: 'Persistence',            count: 18 },
  { id: 'priv',    label: 'Privilege Escalation',   count: 12 },
  { id: 'def',     label: 'Defense Evasion',        count: 37 },
  { id: 'cred',    label: 'Credential Access',      count: 14 },
  { id: 'disc',    label: 'Discovery',              count: 24 },
  { id: 'lat',     label: 'Lateral Movement',       count: 9 },
  { id: 'coll',    label: 'Collection',             count: 17 },
  { id: 'cc',      label: 'Command and Control',    count: 16 },
  { id: 'exfil',   label: 'Exfiltration',           count: 9 },
  { id: 'impact',  label: 'Impact',                 count: 13 },
];

/* Generate deterministic cell states for each tactic */
function genCells(seed, count) {
  const cells = [];
  let s = seed;
  for (let i = 0; i < count; i++) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const v = Math.abs(s) % 100;
    // roughly: 45% covered, 45% exposed, 10% N/A
    cells.push(v < 45 ? 'covered' : v < 90 ? 'exposed' : 'na');
  }
  return cells;
}

const TACTIC_CELLS = TACTICS.map((t, i) => genCells(i * 73 + 31, t.count));

const CELL_COLORS = {
  covered: { bg: '#DBEAFE', border: '#93C5FD' },
  exposed: { bg: '#FEE2E2', border: '#FCA5A5' },
  na:      { bg: '#F3F4F6', border: '#E5E7EB' },
};

function TacticIcon({ id }) {
  const icons = {
    recon:  <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    resdev: <><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></>,
    init:   <><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/></>,
    exec:   <><path d="m5 3 14 9-14 9V3z"/></>,
    pers:   <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
    priv:   <><path d="m6 9 6 6 6-6"/></>,
    def:    <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></>,
    cred:   <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
    disc:   <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></>,
    lat:    <><path d="M17 8h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2v4l-4-4H9a1.994 1.994 0 0 1-1.414-.586m0 0L11 14h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2v4l.586-.586z"/></>,
    coll:   <><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></>,
    cc:     <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.19 12 19.8 19.8 0 0 1 1.12 3.5 2 2 0 0 1 3.09 1.31h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92z"/></>,
    exfil:  <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></>,
    impact: <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></>,
  };
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {icons[id]}
    </svg>
  );
}

const PRODUCTS = [
  { name: 'Microsoft Defender for Identity',  covered: 12, total: 17 },
  { name: 'Microsoft Defender for Office 365', covered: 9,  total: 17 },
  { name: 'Microsoft Intune',                 covered: 7,  total: 17 },
  { name: 'Microsoft Defender for Cloud Apps', covered: 6,  total: 17 },
  { name: 'Microsoft Sentinel',               covered: 5,  total: 17 },
];

function PlatformMatrix() {
  return (
    <div style={{ padding: '0 0 40px', minWidth: 1100 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '28px 32px 20px',
        background: '#fff', borderBottom: '1px solid rgba(0,26,65,0.07)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div>
          <h1 style={{ font: '800 22px var(--bes-font-display)', color: '#001A41', margin: 0, letterSpacing: '-0.02em' }}>Matriz MITRE ATT&amp;CK</h1>
          <p style={{ font: '400 13px var(--bes-font-body)', color: '#9CA3AF', margin: '3px 0 0' }}>Superficie de ataque de tu tenant según el framework MITRE ATT&amp;CK for M365</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 9, border: '1px solid rgba(0,26,65,0.12)', background: '#fff', font: '600 13px var(--bes-font-body)', color: '#001A41', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Exportar
          </button>
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 9, border: 'none', background: '#0075F2', font: '600 13px var(--bes-font-body)', color: '#fff', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m5 3 14 9-14 9V3z"/></svg>
            Simular plan Besafe
          </button>
        </div>
      </div>

      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Top stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[
            {
              label: 'COBERTURA GENERAL',
              content: (
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                    <span style={{ font: '900 36px var(--bes-font-display)', color: '#001A41', letterSpacing: '-0.04em', lineHeight: 1 }}>49%</span>
                    <span style={{ font: '500 12.5px var(--bes-font-body)', color: '#4B5563' }}>Cobertura</span>
                  </div>
                  <div style={{ height: 5, background: '#F3F4F6', borderRadius: 999, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{ width: '49%', height: '100%', background: '#0075F2', borderRadius: 999 }}/>
                  </div>
                  <div style={{ display: 'flex', gap: 12, font: '500 10.5px var(--bes-font-body)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 7, height: 7, background: '#93C5FD', borderRadius: 2 }}/>
                      <span style={{ color: '#4B5563' }}>18 Cubiertas</span>
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 7, height: 7, background: '#FCA5A5', borderRadius: 2 }}/>
                      <span style={{ color: '#4B5563' }}>19 Expuestas</span>
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 7, height: 7, background: '#E5E7EB', borderRadius: 2 }}/>
                      <span style={{ color: '#4B5563' }}>0 N/A</span>
                    </span>
                  </div>
                </div>
              ),
            },
            {
              label: 'TÉCNICAS CUBIERTAS',
              icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0075F2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>,
              content: (
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ font: '900 36px var(--bes-font-display)', color: '#001A41', letterSpacing: '-0.04em', lineHeight: 1 }}>18</span>
                    <span style={{ font: '500 14px var(--bes-font-body)', color: '#9CA3AF' }}>/ 37</span>
                  </div>
                  <div style={{ font: '500 11.5px var(--bes-font-body)', color: '#4B5563', marginTop: 4 }}>Técnicas mitigadas</div>
                </div>
              ),
            },
            {
              label: 'TÉCNICAS EXPUESTAS',
              labelColor: '#EF4444',
              icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>,
              content: (
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ font: '900 36px var(--bes-font-display)', color: '#EF4444', letterSpacing: '-0.04em', lineHeight: 1 }}>19</span>
                    <span style={{ font: '500 14px var(--bes-font-body)', color: '#9CA3AF' }}>/ 37</span>
                  </div>
                  <div style={{ font: '500 11.5px var(--bes-font-body)', color: '#4B5563', marginTop: 4 }}>Requieren atención</div>
                </div>
              ),
            },
            {
              label: 'PRODUCTOS ACTIVOS',
              icon: (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, width: 30, height: 30 }}>
                  {[0,1,2,3].map(i => <div key={i} style={{ borderRadius: 3, background: i < 2 ? '#DBEAFE' : '#F3F4F6' }}/>)}
                </div>
              ),
              content: (
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ font: '900 36px var(--bes-font-display)', color: '#001A41', letterSpacing: '-0.04em', lineHeight: 1 }}>12</span>
                    <span style={{ font: '500 14px var(--bes-font-body)', color: '#9CA3AF' }}>/ 15</span>
                  </div>
                  <div style={{ font: '500 11.5px var(--bes-font-body)', color: '#4B5563', marginTop: 4 }}>Contribuyendo a la cobertura</div>
                </div>
              ),
            },
          ].map((card, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: 14, padding: '18px 20px',
              border: '1px solid rgba(0,26,65,0.07)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  font: '700 9.5px var(--bes-font-body)',
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: card.labelColor || '#9CA3AF', marginBottom: 10,
                }}>{card.label}</div>
                {card.content}
              </div>
              {card.icon && <div style={{ flexShrink: 0, marginLeft: 12 }}>{card.icon}</div>}
            </div>
          ))}
        </div>

        {/* Matrix */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(0,26,65,0.07)', padding: '20px', overflowX: 'auto' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: `repeat(${TACTICS.length}, 1fr)`,
            gap: 4, minWidth: 1060,
          }}>
            {/* Tactic headers */}
            {TACTICS.map((t, i) => (
              <div key={t.id} style={{ textAlign: 'center', padding: '0 2px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4, color: '#4B5563' }}>
                  <TacticIcon id={t.id}/>
                </div>
                <div style={{ font: '700 10px var(--bes-font-display)', color: '#001A41', lineHeight: 1.2, marginBottom: 2 }}>{t.label}</div>
                <div style={{ font: '500 9.5px var(--bes-font-body)', color: '#9CA3AF' }}>{t.count} técnicas</div>
              </div>
            ))}

            {/* Cells */}
            {TACTICS.map((t, colIdx) => {
              const cells = TACTIC_CELLS[colIdx];
              return (
                <div key={t.id} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {cells.map((state, rowIdx) => {
                    const c = CELL_COLORS[state];
                    return (
                      <div key={rowIdx} title={`${t.label} — Technique ${rowIdx + 1}`} style={{
                        height: 13, borderRadius: 2,
                        background: c.bg,
                        border: `1px solid ${c.border}`,
                        cursor: 'pointer', transition: 'transform 100ms, box-shadow 100ms',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.2)'; e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)'; e.currentTarget.style.zIndex = '2'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.zIndex = '1'; }}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 20, marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(0,26,65,0.06)' }}>
            {[
              { state: 'covered', label: 'Cubierta' },
              { state: 'exposed', label: 'Expuesta' },
              { state: 'na',      label: 'No aplicable' },
            ].map(({ state, label }) => {
              const c = CELL_COLORS[state];
              return (
                <div key={state} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: c.bg, border: `1px solid ${c.border}` }}/>
                  <span style={{ font: '500 12px var(--bes-font-body)', color: '#4B5563' }}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contribución por producto */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(0,26,65,0.07)', padding: '22px 24px' }}>
          <div style={{ marginBottom: 4 }}>
            <div style={{ font: '700 14px var(--bes-font-display)', color: '#001A41', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              Contribución por producto
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            </div>
            <div style={{ font: '400 12.5px var(--bes-font-body)', color: '#9CA3AF', marginTop: 2 }}>Productos activos y su impacto en la cobertura de técnicas.</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14, marginTop: 16 }}>
            {PRODUCTS.map((p, i) => (
              <div key={i} style={{
                padding: '16px 16px 14px',
                borderRadius: 12, border: '1px solid rgba(0,26,65,0.07)',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: '#E0F2FE', display: 'grid', placeItems: 'center',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0075F2" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                </div>
                <div style={{ font: '600 11px var(--bes-font-display)', color: '#001A41', lineHeight: 1.3 }}>{p.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ font: '800 18px var(--bes-font-display)', color: '#0075F2', letterSpacing: '-0.02em' }}>{p.covered}</span>
                  <span style={{ font: '500 12px var(--bes-font-body)', color: '#9CA3AF' }}>/ {p.total} técnicas</span>
                </div>
                <div style={{ height: 4, background: '#F3F4F6', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${(p.covered/p.total)*100}%`, height: '100%', background: '#0075F2', borderRadius: 999 }}/>
                </div>
              </div>
            ))}
            {/* "Ver todos los productos" card */}
            <div style={{
              padding: '16px', borderRadius: 12,
              border: '1px dashed rgba(0,117,242,0.25)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: 'pointer',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, width: 28, height: 28 }}>
                {[0,1,2,3].map(i => <div key={i} style={{ borderRadius: 3, background: '#DBEAFE' }}/>)}
              </div>
              <div style={{ font: '600 11px var(--bes-font-display)', color: '#0075F2', textAlign: 'center', lineHeight: 1.3 }}>Ver todos los productos</div>
              <div style={{ font: '500 10.5px var(--bes-font-body)', color: '#9CA3AF' }}>12 activos</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PlatformMatrix });
