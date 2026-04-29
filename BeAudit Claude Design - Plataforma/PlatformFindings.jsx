/* Hallazgos de seguridad view */

const SEV_MAP = {
  'CRÍTICO': { color: '#EF4444', bg: '#FEE2E2' },
  'ALTO':    { color: '#F97316', bg: '#FFEDD5' },
  'MEDIO':   { color: '#3B82F6', bg: '#DBEAFE' },
  'BAJO':    { color: '#6B7280', bg: '#F3F4F6' },
};

const HALLAZGOS = [
  { sev: 'CRÍTICO', title: 'Exposición pública de almacenamiento S3', desc: 'El bucket S3 permite acceso público no autenticado a objetos sensibles.', servicio: 'Amazon S3', rec: 'Restringir acceso público', recColor: '#EF4444', detected: 'Hace 2 horas' },
  { sev: 'CRÍTICO', title: 'Permisos excesivos en rol IAM', desc: 'El rol IAM tiene permisos administrativos innecesarios en múltiples servicios.', servicio: 'AWS IAM', rec: 'Aplicar principio de mínimo privilegio', recColor: '#EF4444', detected: 'Hace 5 horas' },
  { sev: 'ALTO',    title: 'Grupo de seguridad con acceso 0.0.0.0/0', desc: 'El grupo de seguridad permite acceso a puertos sensibles desde cualquier IP.', servicio: 'Amazon EC2', rec: 'Restringir rangos de IP', recColor: '#F97316', detected: 'Hace 8 horas' },
  { sev: 'ALTO',    title: 'Contraseñas de RDS sin rotación automática', desc: 'La instancia RDS no tiene habilitada la rotación automática de contraseñas.', servicio: 'Amazon RDS', rec: 'Habilitar rotación automática', recColor: '#F97316', detected: 'Hace 12 horas' },
  { sev: 'MEDIO',   title: 'Registros de CloudTrail no habilitados en todas las regiones', desc: 'CloudTrail no está habilitado en todas las regiones de la cuenta.', servicio: 'AWS CloudTrail', rec: 'Habilitar en todas las regiones', recColor: '#3B82F6', detected: 'Ayer' },
  { sev: 'MEDIO',   title: 'Falta de cifrado en reposo', desc: 'Algunos volúmenes EBS no tienen cifrado en reposo habilitado.', servicio: 'Amazon EBS', rec: 'Habilitar cifrado en reposo', recColor: '#3B82F6', detected: 'Ayer' },
];

function AWSLogo() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 26, height: 14, borderRadius: 3,
      background: '#FF9900', color: '#232F3E',
      font: '800 7.5px monospace', letterSpacing: '0.05em',
      flexShrink: 0,
    }}>aws</span>
  );
}

function PlatformFindings() {
  const [search, setSearch] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('Medios');

  const filtered = HALLAZGOS.filter(h =>
    !search || h.title.toLowerCase().includes(search.toLowerCase())
  );

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
          <h1 style={{ font: '800 22px var(--bes-font-display)', color: '#001A41', margin: 0, letterSpacing: '-0.02em' }}>
            <span style={{ fontWeight: 800 }}>Hallazgos</span>
            <span style={{ fontWeight: 400 }}> de seguridad</span>
          </h1>
          <p style={{ font: '400 13px var(--bes-font-body)', color: '#9CA3AF', margin: '3px 0 0' }}>Lista de riesgos de seguridad detectados en tus activos y servicios.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 9, border: '1px solid rgba(0,26,65,0.12)', background: '#fff', font: '600 13px var(--bes-font-body)', color: '#001A41', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Exportar
          </button>
          <button style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 9, border: 'none', background: '#0075F2', font: '600 13px var(--bes-font-body)', color: '#fff', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
            Nuevo hallazgo
          </button>
        </div>
      </div>

      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[
            { label: 'Críticos', count: 7, color: '#EF4444', bg: '#FEF2F2', icon: '!', borderColor: '#EF4444', active: false },
            { label: 'Altos', count: 15, color: '#F97316', bg: '#FFF7ED', icon: '!', borderColor: '#F97316', active: false },
            { label: 'Medios', count: 24, color: '#3B82F6', bg: '#EFF6FF', icon: 'i', borderColor: '#3B82F6', active: true },
            { label: 'Total hallazgos', count: 46, color: '#6B7280', bg: '#F9FAFB', icon: '·', borderColor: '#E5E7EB', active: false },
          ].map((s, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: 14, padding: '18px 20px',
              border: `1px solid ${s.active ? s.borderColor : 'rgba(0,26,65,0.07)'}`,
              borderBottom: `3px solid ${s.borderColor}`,
              cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: s.bg, color: s.color,
                  display: 'grid', placeItems: 'center',
                  font: '900 16px var(--bes-font-display)',
                  border: `2px solid ${s.color}`,
                }}>{s.icon}</div>
                <div>
                  <div style={{ font: '800 28px var(--bes-font-display)', color: '#001A41', lineHeight: 1, letterSpacing: '-0.03em' }}>{s.count}</div>
                  <div style={{ font: '500 12px var(--bes-font-body)', color: '#9CA3AF', marginTop: 2 }}>{s.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid rgba(0,26,65,0.07)', padding: '14px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '0 0 220px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar hallazgos..."
                style={{
                  width: '100%', padding: '8px 12px 8px 32px',
                  borderRadius: 8, border: '1px solid rgba(0,26,65,0.10)',
                  font: '400 13px var(--bes-font-body)', color: '#001A41',
                  outline: 'none', background: '#F9FAFB',
                }}/>
            </div>
            {['Severidad', 'Servicio afectado', 'Estado', 'Más filtros'].map(f => (
              <button key={f} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 13px', borderRadius: 8,
                border: '1px solid rgba(0,26,65,0.10)', background: '#fff',
                font: '500 12.5px var(--bes-font-body)', color: '#4B5563', cursor: 'pointer',
              }}>
                {f}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m6 9 6 6 6-6"/></svg>
              </button>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ font: '500 12px var(--bes-font-body)', color: '#9CA3AF' }}>Ordenar por:</span>
              <button style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 8, border: '1px solid rgba(0,26,65,0.10)', background: '#fff', font: '600 12.5px var(--bes-font-body)', color: '#001A41', cursor: 'pointer' }}>
                Más recientes
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              <button style={{ padding: '8px', borderRadius: 8, border: '1px solid rgba(0,26,65,0.10)', background: '#fff', color: '#4B5563', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 6H3M16 12H8M11 18H8"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(0,26,65,0.07)', overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 180px 1fr 140px 24px',
            gap: 0, padding: '11px 20px',
            borderBottom: '1px solid rgba(0,26,65,0.07)',
            background: '#F9FAFB',
          }}>
            {['HALLAZGO', 'SERVICIO AFECTADO', 'RECOMENDACIÓN', 'DETECTADO', ''].map((h, i) => (
              <div key={i} style={{
                font: '700 10px var(--bes-font-body)', color: '#9CA3AF',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                {h}
                {h === 'DETECTADO' && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>}
              </div>
            ))}
          </div>
          {filtered.map((h, i) => {
            const sev = SEV_MAP[h.sev] || SEV_MAP['BAJO'];
            return (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1fr 180px 1fr 140px 24px',
                gap: 0, padding: '16px 20px',
                borderBottom: i < filtered.length - 1 ? '1px solid rgba(0,26,65,0.05)' : 'none',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'background 150ms',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingRight: 16 }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    padding: '3px 8px', borderRadius: 5, flexShrink: 0,
                    background: sev.bg, color: sev.color,
                    font: '800 9px var(--bes-font-display)', letterSpacing: '0.05em',
                    border: `1px solid ${sev.color}22`,
                  }}>{h.sev}</span>
                  <div>
                    <div style={{ font: '700 13px var(--bes-font-display)', color: '#001A41', lineHeight: 1.3, marginBottom: 3 }}>{h.title}</div>
                    <div style={{ font: '400 11.5px var(--bes-font-body)', color: '#9CA3AF', lineHeight: 1.4 }}>{h.desc}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AWSLogo/>
                  <span style={{ font: '600 12px var(--bes-font-body)', color: '#4B5563' }}>{h.servicio}</span>
                </div>
                <div>
                  <button style={{
                    padding: '5px 12px', borderRadius: 6,
                    border: `1px solid ${h.recColor}33`,
                    background: `${h.recColor}08`,
                    color: h.recColor,
                    font: '600 11.5px var(--bes-font-display)', cursor: 'pointer',
                  }}>{h.rec}</button>
                </div>
                <div style={{ font: '500 12px var(--bes-font-body)', color: '#9CA3AF' }}>{h.detected}</div>
                <div>
                  <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 4 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          <div style={{
            padding: '14px 20px', borderTop: '1px solid rgba(0,26,65,0.07)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#F9FAFB',
          }}>
            <span style={{ font: '400 12.5px var(--bes-font-body)', color: '#9CA3AF' }}>Mostrando 1 a 6 de 46 hallazgos</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {['‹', '1', '2', '3', '…', '8', '›'].map((p, i) => (
                <button key={i} style={{
                  width: 30, height: 30, borderRadius: 6,
                  border: '1px solid rgba(0,26,65,0.10)',
                  background: p === '1' ? '#0075F2' : '#fff',
                  color: p === '1' ? '#fff' : '#001A41',
                  font: '600 12.5px var(--bes-font-display)', cursor: 'pointer',
                  display: 'grid', placeItems: 'center',
                }}>{p}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PlatformFindings });
