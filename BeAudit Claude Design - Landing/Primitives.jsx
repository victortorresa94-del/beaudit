/**
 * BeServices website UI kit — shared JSX components.
 * Loaded via <script type="text/babel"> in index.html.
 * All components attach to window at the end.
 */

const { useState, useEffect } = React;

/* ------------------------------------------------------------------
   Icon — thin wrapper so we can change the icon provider later.
   Uses Lucide-style inline SVGs so the kit is self-contained.
   ------------------------------------------------------------------ */
function Icon({ name, size = 20, stroke = 1.75, className = '' }) {
  const paths = {
    arrow:   <path d="M5 12h14M13 6l6 6-6 6"/>,
    check:   <path d="M20 6 9 17l-5-5"/>,
    shield:  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
    cloud:   <path d="M17.5 19a4.5 4.5 0 1 0 0-9h-1.8a7 7 0 1 0-13.5 2.6"/>,
    zap:     <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>,
    cog:     <g><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></g>,
    sparkle: <g><path d="M9.94 2.93 11 7l4.06 1.06L11 9.13 9.94 13.2 8.88 9.13 4.82 8.06 8.88 7zM19 13l.7 2.3L22 16l-2.3.7L19 19l-.7-2.3L16 16l2.3-.7z"/></g>,
    menu:    <g><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></g>,
    x:       <g><path d="M18 6 6 18"/><path d="m6 6 12 12"/></g>,
    phone:   <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.94.37 1.86.7 2.74a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.34-1.34a2 2 0 0 1 2.11-.45c.88.33 1.8.57 2.74.7a2 2 0 0 1 1.72 2z"/>,
    mail:    <g><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></g>,
    mapPin:  <g><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></g>,
    quote:   <g><path d="M3 21c3 0 7-1 7-8V5c0-1-1-2-2-2H4c-1 0-2 1-2 2v6c0 1 1 2 2 2h3"/><path d="M15 21c3 0 7-1 7-8V5c0-1-1-2-2-2h-4c-1 0-2 1-2 2v6c0 1 1 2 2 2h3"/></g>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {paths[name]}
    </svg>
  );
}

/* ------------------------------------------------------------------ Button */
function Button({ variant = 'primary', children, onClick, href, icon, size = 'md', className = '' }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999,
    fontFamily: 'var(--bes-font-body)', fontWeight: 600, cursor: 'pointer',
    letterSpacing: '-0.005em', border: '1px solid transparent', textDecoration: 'none',
    transition: 'all 200ms var(--bes-ease-out)',
    padding: size === 'lg' ? '16px 32px' : size === 'sm' ? '8px 16px' : '13px 26px',
    fontSize: size === 'sm' ? 13 : size === 'lg' ? 16 : 14,
  };
  const v = {
    primary:   { background: '#0075F2', color: '#fff', boxShadow: '0 6px 18px rgba(0,117,242,0.25)' },
    secondary: { background: '#fff', color: '#001A41', borderColor: 'rgba(0,26,65,0.15)' },
    dark:      { background: '#001A41', color: '#fff' },
    ghost:     { background: 'transparent', color: '#001A41', padding: size === 'lg' ? '16px 20px' : '13px 16px' },
    white:     { background: '#fff', color: '#001A41' },
  }[variant];
  const Tag = href ? 'a' : 'button';
  return (
    <Tag href={href} onClick={onClick} className={className} style={{ ...base, ...v }}>
      {children}
      {icon !== false && <Icon name="arrow" size={16} stroke={2} />}
    </Tag>
  );
}

/* ------------------------------------------------------------------ Overline */
function Overline({ children, color = '#0075F2' }) {
  return (
    <span style={{
      font: '700 11px var(--bes-font-body)',
      letterSpacing: '0.22em', textTransform: 'uppercase', color,
    }}>{children}</span>
  );
}

/* ------------------------------------------------------------------ Section */
function Section({ children, bg = 'white', style = {}, id }) {
  const bgs = {
    white: '#fff',
    soft:  '#F9FAFB',
    navy:  '#001A41',
    hero:  '#fff',
  };
  return (
    <section id={id} style={{
      background: bgs[bg],
      color: bg === 'navy' ? '#fff' : '#001A41',
      padding: '96px 40px',
      position: 'relative', overflow: 'hidden',
      ...style,
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
        {children}
      </div>
    </section>
  );
}

Object.assign(window, { Icon, Button, Overline, Section });
