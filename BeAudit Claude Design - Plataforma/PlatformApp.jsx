/* BeAudit Platform — shared sidebar + app shell */

const NAV_ITEMS = [
  { id: 'overview',    label: 'Overview',     icon: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>, sub: <polyline points="9 22 9 12 15 12 15 22"/> },
  { id: 'risk',        label: 'Risk',         icon: <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/> },
  { id: 'findings',    label: 'Findings',     icon: <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></>, badge: 2 },
  { id: 'assets',      label: 'Assets',       icon: <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></> },
  { id: 'users',       label: 'Users',        icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></> },
  { id: 'controls',    label: 'Controls',     icon: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></> },
  { id: 'frameworks',  label: 'Frameworks',   icon: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></> },
  { id: 'automations', label: 'Automations',  icon: <><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></> },
  { id: 'reports',     label: 'Reports',      icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></> },
];

const NAV_BOTTOM = [
  { id: 'integrations', label: 'Integrations', icon: <><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></> },
  { id: 'settings',     label: 'Settings',     icon: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8 2 2 0 1 1-2.8 2.8 1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5 2 2 0 1 1-4 0 1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3 2 2 0 1 1-2.8-2.8 1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1 2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8 2 2 0 1 1 2.8-2.8 1.7 1.7 0 0 0 1.8.3 1.7 1.7 0 0 0 1-1.5 2 2 0 1 1 4 0 1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3 2 2 0 1 1 2.8 2.8 1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1 2 2 0 1 1 0 4 1.7 1.7 0 0 0-1.5 1z"/></> },
];

function NavIcon({ paths, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths}
    </svg>
  );
}

/* Mini sparkline for autopilot widget */
function MiniSparkline() {
  const pts = [0,3,1,5,2,7,4,6,8,5,9,7,10,6,12,9,14,8,15,10,16,9,18,12,20,10];
  const path = pts.reduce((acc, v, i) => i % 2 === 0
    ? acc + (i === 0 ? `M${v * 7},${40 - pts[i+1]*2}` : ` L${v * 7},${40 - pts[i+1]*2}`)
    : acc, '');
  return (
    <svg viewBox="0 0 140 44" width="100%" height="36" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="sparkFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={path + ' L140,44 L0,44 Z'} fill="url(#sparkFill)"/>
      <path d={path} fill="none" stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function Sidebar({ active, onNav }) {
  return (
    <aside style={{
      width: 188, flexShrink: 0,
      background: '#0D1B2E',
      display: 'flex', flexDirection: 'column',
      height: '100vh', overflowY: 'auto',
      borderRight: '1px solid rgba(255,255,255,0.05)',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 18px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, background: '#0075F2',
            display: 'grid', placeItems: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <span style={{ font: '800 16px var(--bes-font-display)', color: '#fff', letterSpacing: '-0.02em' }}>BeAudit</span>
        </div>
      </div>

      {/* Org selector */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 10px', borderRadius: 8,
          background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer',
          color: '#fff',
        }}>
          <span style={{ font: '600 12.5px var(--bes-font-body)', color: '#fff' }}>Acme Corporation</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </button>
      </div>

      {/* Main nav */}
      <nav style={{ flex: 1, padding: '10px 10px 0' }}>
        {NAV_ITEMS.map(({ id, label, icon, sub, badge }) => {
          const isActive = active === id;
          return (
            <button key={id} onClick={() => onNav(id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 10px', borderRadius: 8, marginBottom: 2,
              background: isActive ? '#0075F2' : 'transparent',
              border: 'none', cursor: 'pointer',
              color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
              font: `${isActive ? 600 : 500} 13px var(--bes-font-body)`,
              transition: 'all 150ms',
              textAlign: 'left',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}}
            >
              <NavIcon paths={<>{icon}{sub}</>} size={15}/>
              <span style={{ flex: 1 }}>{label}</span>
              {badge && (
                <span style={{
                  minWidth: 18, height: 18, borderRadius: 9, background: '#EF4444',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  font: '700 10px var(--bes-font-display)', color: '#fff', padding: '0 5px',
                }}>{badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom nav */}
      <div style={{ padding: '10px 10px 0', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 8 }}>
        {NAV_BOTTOM.map(({ id, label, icon }) => (
          <button key={id} onClick={() => onNav(id)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 10px', borderRadius: 8, marginBottom: 2,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.45)',
            font: '500 13px var(--bes-font-body)', textAlign: 'left',
            transition: 'all 150ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
          >
            <NavIcon paths={icon} size={15}/>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Autopilot widget */}
      <div style={{
        margin: '12px 10px 10px',
        background: 'rgba(255,255,255,0.04)', borderRadius: 10,
        padding: '12px 12px 10px',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ font: '700 11.5px var(--bes-font-display)', color: '#fff', marginBottom: 2 }}>
          Your security, on autopilot.
        </div>
        <div style={{ font: '400 10.5px var(--bes-font-body)', color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>
          Enable continuous monitoring
        </div>
        <MiniSparkline/>
        <button style={{
          width: '100%', marginTop: 8, padding: '9px 12px',
          borderRadius: 8, border: 'none', background: '#0075F2',
          color: '#fff', font: '700 12px var(--bes-font-display)', cursor: 'pointer',
        }}>Turn on monitoring</button>
      </div>

      {/* User */}
      <div style={{
        padding: '10px 12px 14px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: 'linear-gradient(135deg,#3B82F6,#1D4ED8)',
          display: 'grid', placeItems: 'center',
          font: '700 11px var(--bes-font-display)', color: '#fff', flexShrink: 0,
        }}>AK</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ font: '600 12px var(--bes-font-display)', color: '#fff', lineHeight: 1.2 }}>Alex Kim</div>
          <div style={{ font: '400 10.5px var(--bes-font-body)', color: 'rgba(255,255,255,0.45)', lineHeight: 1.2 }}>Security Admin</div>
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </div>
    </aside>
  );
}

function PlaceholderView({ id }) {
  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F8FAFC',
    }}>
      <div style={{ textAlign: 'center', color: '#9CA3AF' }}>
        <div style={{ font: '700 18px var(--bes-font-display)', color: '#001A41', marginBottom: 8 }}>
          {id.charAt(0).toUpperCase() + id.slice(1)}
        </div>
        <div style={{ font: '400 14px var(--bes-font-body)' }}>Coming soon</div>
      </div>
    </div>
  );
}

function PlatformApp() {
  const [view, setView] = React.useState('overview');
  let content;
  if (view === 'overview')   content = <PlatformOverview/>;
  else if (view === 'findings')   content = <PlatformFindings/>;
  else if (view === 'frameworks') content = <PlatformMatrix/>;
  else content = <PlaceholderView id={view}/>;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: 'var(--bes-font-body)' }}>
      <Sidebar active={view} onNav={setView}/>
      <main style={{ flex: 1, overflowY: 'auto', background: '#F8FAFC' }}>
        {content}
      </main>
    </div>
  );
}

Object.assign(window, { PlatformApp });
