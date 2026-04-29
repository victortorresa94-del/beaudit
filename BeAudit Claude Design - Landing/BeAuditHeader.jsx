/* BeAudit header with main nav. */

function BeAuditLogo({ variant = 'dark' }) {
  const ink = variant === 'dark' ? '#001A41' : '#FFFFFF';
  const sub = variant === 'dark' ? 'rgba(0,26,65,0.55)' : 'rgba(255,255,255,0.65)';
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: '#0075F2',
        display: 'grid', placeItems: 'center',
        boxShadow: '0 4px 12px rgba(0,117,242,0.25)',
        position: 'relative', overflow: 'hidden',
      }}>
        <span style={{
          font: '800 22px/1 var(--bes-font-display)',
          color: '#fff', letterSpacing: '-0.04em',
        }}>B</span>
        <div style={{
          position: 'absolute', right: -6, top: -6, width: 18, height: 18,
          borderRadius: '50%', background: 'rgba(0,212,255,0.55)', filter: 'blur(4px)',
        }}/>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span style={{
          font: '800 21px/1 var(--bes-font-display)',
          letterSpacing: '-0.025em', color: ink,
        }}>BeAudit</span>
        <span style={{
          font: '500 10px/1 var(--bes-font-body)',
          color: sub, marginTop: 4, letterSpacing: '0.01em',
        }}>by BeServices</span>
      </div>
    </div>
  );
}

function NavLink({ label, hasMenu = true }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        font: '500 14px var(--bes-font-body)',
        color: hover ? '#0075F2' : '#001A41',
        letterSpacing: '-0.005em',
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '6px 2px', transition: 'color 200ms',
      }}>
      {label}
      {hasMenu && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 1 }}>
          <path d="m6 9 6 6 6-6"/>
        </svg>
      )}
    </button>
  );
}

function BeAuditHeader() {
  return (
    <header style={{
      position: 'relative', zIndex: 50,
      background: '#fff',
      borderBottom: '1px solid rgba(0,26,65,0.06)',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        padding: '20px 48px',
        display: 'flex', alignItems: 'center', gap: 40,
      }}>
        <a href="#top" style={{ textDecoration: 'none' }}>
          <BeAuditLogo />
        </a>
        <nav style={{
          display: 'flex', gap: 36, flex: 1, justifyContent: 'center',
        }}>
          <NavLink label="Product" />
          <NavLink label="Solutions" />
          <NavLink label="Pricing" hasMenu={false} />
          <NavLink label="Resources" />
          <NavLink label="Company" />
        </nav>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <a href="#login" style={{
            font: '500 14px var(--bes-font-body)',
            color: '#001A41', textDecoration: 'none',
          }}>Log in</a>
          <Button variant="primary" size="sm">Request demo</Button>
        </div>
      </div>
    </header>
  );
}

Object.assign(window, { BeAuditHeader, BeAuditLogo });
