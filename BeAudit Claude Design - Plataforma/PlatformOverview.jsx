/* Security Overview view */

function ScoreLine({ label, value, max = 100, color = '#0075F2' }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, alignItems: 'center', marginBottom: 10 }}>
      <div style={{ font: '500 12.5px var(--bes-font-body)', color: '#4B5563' }}>{label}</div>
      <div style={{ width: 140, height: 5, background: '#F3F4F6', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${(value/max)*100}%`, height: '100%', background: color, borderRadius: 999 }}/>
      </div>
      <div style={{ font: '600 12px var(--bes-font-display)', color: '#001A41', minWidth: 56, textAlign: 'right' }}>{value} / {max}</div>
    </div>
  );
}

/* Donut chart (SVG) for Users card */
function DonutChart({ segments, total }) {
  const size = 130, stroke = 22, r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        {segments.map((seg, i) => {
          const dash = (seg.pct / 100) * c;
          const el = (
            <circle key={i} cx={size/2} cy={size/2} r={r}
              fill="none" stroke={seg.color} strokeWidth={stroke}
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset * c / 100}
              strokeLinecap="butt"
            />
          );
          offset += seg.pct;
          return el;
        })}
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ font: '800 20px var(--bes-font-display)', color: '#001A41', lineHeight: 1 }}>{total.toLocaleString()}</div>
        <div style={{ font: '500 10px var(--bes-font-body)', color: '#9CA3AF' }}>Total</div>
      </div>
    </div>
  );
}

/* Area chart for risk score */
function RiskAreaChart() {
  const labels = ['May 12','May 19','May 26','Jun 2','Jun 9'];
  const pts = [60,58,62,65,68,70,72,74,76];
  const minY = 0, maxY = 100, W = 400, H = 90;
  const xStep = W / (pts.length - 1);
  const yScale = (v) => H - ((v - minY) / (maxY - minY)) * H;
  const pathD = pts.map((v, i) => `${i === 0 ? 'M' : 'L'}${i * xStep},${yScale(v)}`).join(' ');
  const areaD = pathD + ` L${(pts.length-1)*xStep},${H} L0,${H} Z`;
  const gridLines = [0, 25, 50, 75, 100];
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${W} ${H + 10}`} width="100%" height={H + 10} preserveAspectRatio="none" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="riskAreaFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0075F2" stopOpacity="0.18"/>
            <stop offset="100%" stopColor="#0075F2" stopOpacity="0"/>
          </linearGradient>
        </defs>
        {gridLines.map(v => (
          <line key={v} x1="0" y1={yScale(v)} x2={W} y2={yScale(v)}
            stroke="rgba(0,26,65,0.07)" strokeWidth="0.8"/>
        ))}
        <path d={areaD} fill="url(#riskAreaFill)"/>
        <path d={pathD} fill="none" stroke="#0075F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        {/* last dot */}
        <circle cx={(pts.length-1)*xStep} cy={yScale(pts[pts.length-1])} r="4" fill="#0075F2"/>
      </svg>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        font: '500 10px var(--bes-font-body)', color: '#9CA3AF', marginTop: 4,
      }}>
        {labels.map(l => <span key={l}>{l}</span>)}
      </div>
    </div>
  );
}

const FINDINGS = [
  { sev: 'Critical', sevColor: '#EF4444', sevBg: '#FEE2E2', title: 'Exposed S3 bucket with public write access', asset: 's3://acme-prod-data', status: 'Open', statusColor: '#EF4444', time: '2h ago' },
  { sev: 'High', sevColor: '#F97316', sevBg: '#FFEDD5', title: 'Critical vulnerability in log4j-core', cve: 'CVE-2021-44228', asset: 'api.acme.com', status: 'Open', statusColor: '#EF4444', time: '5h ago' },
  { sev: 'High', sevColor: '#F97316', sevBg: '#FFEDD5', title: 'Root account without MFA', asset: 'aws-root', status: 'Open', statusColor: '#EF4444', time: '1d ago' },
  { sev: 'Medium', sevColor: '#F59E0B', sevBg: '#FEF3C7', title: 'Security group allows unrestricted RDP', asset: 'sg-0a1b2c3d', status: 'In progress', statusColor: '#F59E0B', time: '2d ago' },
  { sev: 'Medium', sevColor: '#F59E0B', sevBg: '#FEF3C7', title: 'Outdated TLS protocol detected', asset: 'legacy.acme.internal', status: 'Open', statusColor: '#EF4444', time: '3d ago' },
];

const USER_SEGMENTS = [
  { label: 'MFA Enabled', pct: 79.9, color: '#0075F2', n: 1028 },
  { label: 'MFA Enforced', pct: 7.5, color: '#60A5FA', n: 943 },
  { label: 'MFA Disabled', pct: 6.5, color: '#F59E0B', n: 114 },
  { label: 'No MFA', pct: 6.1, color: '#E5E7EB', n: 143 },
];

function PlatformOverview() {
  return (
    <div style={{ padding: '0 0 40px', minWidth: 900 }}>
      {/* Page header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '28px 32px 20px',
        background: '#fff', borderBottom: '1px solid rgba(0,26,65,0.07)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div>
          <h1 style={{ font: '800 22px var(--bes-font-display)', color: '#001A41', margin: 0, letterSpacing: '-0.02em' }}>Security Overview</h1>
          <p style={{ font: '400 13px var(--bes-font-body)', color: '#9CA3AF', margin: '3px 0 0' }}>Real-time posture and risk insights across your organization.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 9, border: '1px solid rgba(0,26,65,0.12)', background: '#fff', font: '600 13px var(--bes-font-body)', color: '#001A41', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51 15.42 17.49M15.41 6.51 8.59 10.49"/></svg>
            Share
          </button>
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 9, border: 'none', background: '#0075F2', font: '600 13px var(--bes-font-body)', color: '#fff', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            Add widget
          </button>
        </div>
      </div>

      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Row 1: Risk Score + Users */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 18 }}>
          {/* Risk Score */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(0,26,65,0.07)', padding: '22px 24px' }}>
            <div style={{ font: '600 13px var(--bes-font-display)', color: '#001A41', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              Security Risk Score
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 20 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                  <span style={{ font: '900 44px var(--bes-font-display)', color: '#001A41', letterSpacing: '-0.04em', lineHeight: 1 }}>76</span>
                  <span style={{ font: '500 16px var(--bes-font-body)', color: '#9CA3AF' }}>/ 100</span>
                  <span style={{ padding: '3px 9px', borderRadius: 999, background: '#FEE2E2', color: '#DC2626', font: '700 11px var(--bes-font-display)' }}>High</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 14, font: '500 12px var(--bes-font-body)', color: '#10B981' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
                  8 pts from last week
                </div>
                <RiskAreaChart/>
                <div style={{ marginTop: 12, font: '600 12px var(--bes-font-body)', color: '#0075F2', display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                  Learn how the score is calculated
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </div>
              </div>
              <div>
                <div style={{ font: '600 11.5px var(--bes-font-body)', color: '#4B5563', marginBottom: 12 }}>Score breakdown</div>
                <ScoreLine label="Asset Security" value={72}/>
                <ScoreLine label="Identity & Access" value={68} color="#F59E0B"/>
                <ScoreLine label="Vulnerability Mgmt" value={82} color="#10B981"/>
                <ScoreLine label="Data Protection" value={74}/>
                <ScoreLine label="Security Monitoring" value={83} color="#10B981"/>
              </div>
            </div>
          </div>

          {/* Users */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(0,26,65,0.07)', padding: '22px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ font: '600 13px var(--bes-font-display)', color: '#001A41' }}>Users</div>
              <div style={{ font: '600 12px var(--bes-font-body)', color: '#0075F2', cursor: 'pointer' }}>View all</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <DonutChart segments={USER_SEGMENTS} total={1285}/>
              <div style={{ flex: 1 }}>
                {USER_SEGMENTS.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }}/>
                    <span style={{ font: '500 11.5px var(--bes-font-body)', color: '#4B5563', flex: 1 }}>{s.label}</span>
                    <span style={{ font: '600 11.5px var(--bes-font-display)', color: '#001A41' }}>{s.n.toLocaleString()}</span>
                    <span style={{ font: '500 10.5px var(--bes-font-body)', color: '#9CA3AF', minWidth: 48, textAlign: 'right' }}>({s.pct}%)</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{
              marginTop: 14, padding: '11px 14px', borderRadius: 10,
              background: '#F8FAFC', border: '1px solid rgba(0,26,65,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: '#E0F2FE', display: 'grid', placeItems: 'center', color: '#0075F2' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                </div>
                <div>
                  <div style={{ font: '700 11.5px var(--bes-font-display)', color: '#001A41' }}>MFA adoption is good</div>
                  <div style={{ font: '400 10.5px var(--bes-font-body)', color: '#4B5563' }}>11% of users still need to enable MFA.</div>
                </div>
              </div>
              <button style={{ padding: '5px 11px', borderRadius: 7, border: '1px solid rgba(0,26,65,0.10)', background: '#fff', font: '600 11px var(--bes-font-display)', color: '#001A41', cursor: 'pointer', flexShrink: 0 }}>View users</button>
            </div>
          </div>
        </div>

        {/* Attack Surface strip */}
        <div style={{
          background: '#0D1B2E', borderRadius: 14, padding: '20px 28px',
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0,
        }}>
          {[
            { label: 'External Assets', icon: <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></>, value: '312', delta: '+4', deltaColor: '#10B981' },
            { label: 'Exposed Services', icon: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8 2 2 0 1 1-2.8 2.8 1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5 2 2 0 1 1-4 0 1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3 2 2 0 1 1-2.8-2.8 1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1 2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.5-1z"/></>, value: '27', delta: '+3', deltaColor: '#10B981' },
            { label: 'Open Ports', icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h2M8 17h8"/></>, value: '143', delta: '↑6', deltaColor: '#EF4444' },
            { label: 'Vulnerabilities', icon: <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/></>, value: '186', delta: '↑14', deltaColor: '#EF4444' },
            { label: 'Internet Exposure', icon: <><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>, value: 'Medium', valueColor: '#F59E0B', noDelta: true },
          ].map((item, i) => (
            <div key={i} style={{
              padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 5,
              borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.07)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.08)', display: 'grid', placeItems: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {item.icon}
                  </svg>
                </div>
                <span style={{ font: '500 11.5px var(--bes-font-body)', color: 'rgba(255,255,255,0.55)' }}>{item.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ font: '800 24px var(--bes-font-display)', color: item.valueColor || '#fff', letterSpacing: '-0.025em', lineHeight: 1 }}>{item.value}</span>
                {!item.noDelta && <span style={{ font: '700 11px var(--bes-font-display)', color: item.deltaColor }}>{item.delta}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Row 3: Findings + Compliance */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18 }}>
          {/* Recent Threat Findings */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(0,26,65,0.07)', padding: '22px 24px' }}>
            <div style={{ font: '600 13.5px var(--bes-font-display)', color: '#001A41', marginBottom: 16 }}>Recent Threat Findings</div>
            <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 130px 100px 60px 20px', gap: 0 }}>
              <div style={{ font: '700 10px var(--bes-font-body)', color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 0 8px', borderBottom: '1px solid rgba(0,26,65,0.07)' }}>Severity</div>
              <div style={{ font: '700 10px var(--bes-font-body)', color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 0 8px', borderBottom: '1px solid rgba(0,26,65,0.07)' }}>Finding</div>
              <div style={{ font: '700 10px var(--bes-font-body)', color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 0 8px', borderBottom: '1px solid rgba(0,26,65,0.07)' }}>Asset</div>
              <div style={{ font: '700 10px var(--bes-font-body)', color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 0 8px', borderBottom: '1px solid rgba(0,26,65,0.07)' }}>Status</div>
              <div style={{ font: '700 10px var(--bes-font-body)', color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 0 8px', borderBottom: '1px solid rgba(0,26,65,0.07)' }}>First seen</div>
              <div style={{ borderBottom: '1px solid rgba(0,26,65,0.07)' }}/>
            </div>
            {FINDINGS.map((f, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '90px 1fr 130px 100px 60px 20px',
                gap: 0, padding: '12px 0',
                borderBottom: i < FINDINGS.length - 1 ? '1px solid rgba(0,26,65,0.05)' : 'none',
                alignItems: 'center',
              }}>
                <div>
                  <span style={{
                    padding: '3px 9px', borderRadius: 5,
                    background: f.sevBg, color: f.sevColor,
                    font: '700 10px var(--bes-font-display)',
                  }}>{f.sev}</span>
                </div>
                <div>
                  <div style={{ font: '600 12.5px var(--bes-font-body)', color: '#001A41', lineHeight: 1.3 }}>
                    {f.title}
                    {f.cve && <span style={{ marginLeft: 6, padding: '1px 6px', borderRadius: 4, background: '#F3F4F6', color: '#4B5563', font: '600 10px var(--bes-font-display)' }}>{f.cve}</span>}
                  </div>
                </div>
                <div style={{ font: '500 11.5px var(--bes-font-body)', color: '#4B5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>{f.asset}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, font: '500 11.5px var(--bes-font-body)', color: '#4B5563' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: f.statusColor }}/>
                  {f.status}
                </div>
                <div style={{ font: '500 11px var(--bes-font-body)', color: '#9CA3AF' }}>{f.time}</div>
                <div style={{ color: '#9CA3AF', cursor: 'pointer' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 8, font: '600 12.5px var(--bes-font-body)', color: '#0075F2', display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
              View all findings
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </div>
          </div>

          {/* Compliance posture */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(0,26,65,0.07)', padding: '22px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ font: '600 13.5px var(--bes-font-display)', color: '#001A41' }}>Compliance posture</div>
              <div style={{ font: '600 12px var(--bes-font-body)', color: '#0075F2', cursor: 'pointer' }}>View details</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
              <span style={{ font: '900 40px var(--bes-font-display)', color: '#001A41', letterSpacing: '-0.04em', lineHeight: 1 }}>68%</span>
            </div>
            <div style={{ font: '600 12.5px var(--bes-font-body)', color: '#001A41', marginBottom: 4 }}>Overall compliance</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, font: '500 11.5px var(--bes-font-body)', color: '#10B981', marginBottom: 20 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
              6% from last month
            </div>
            {[
              { label: 'SOC 2', pct: 72 },
              { label: 'ISO 27001', pct: 64 },
              { label: 'PCI DSS', pct: 58 },
              { label: 'HIPAA', pct: 75 },
            ].map((f, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, font: '600 12px var(--bes-font-body)', color: '#001A41' }}>
                  <span>{f.label}</span><span>{f.pct}%</span>
                </div>
                <div style={{ height: 6, background: '#F3F4F6', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${f.pct}%`, height: '100%', background: f.pct >= 70 ? '#0075F2' : '#F59E0B', borderRadius: 999 }}/>
                </div>
              </div>
            ))}
            <div style={{
              marginTop: 16, padding: '11px 14px', borderRadius: 10,
              background: '#FEF3C7', border: '1px solid #FDE68A',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: '#FDE68A', display: 'grid', placeItems: 'center', color: '#B45309' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div style={{ font: '600 11.5px var(--bes-font-body)', color: '#92400E' }}>2 frameworks need attention</div>
              </div>
              <button style={{ padding: '5px 11px', borderRadius: 7, border: 'none', background: '#F59E0B', font: '600 11px var(--bes-font-display)', color: '#fff', cursor: 'pointer' }}>Open</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PlatformOverview });
