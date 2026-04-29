/* Final CTA section + dark guarantee strip + footer. */

function FinalCTA() {
  return (
    <section style={{ background: '#fff', padding: '72px 48px 0' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Headline */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            display: 'inline-block', padding: '6px 14px', borderRadius: 999,
            background: '#E0F2FE', color: '#0075F2',
            font: '700 11px var(--bes-font-body)',
            letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 22,
          }}>Último paso</div>
          <h2 style={{
            font: '800 clamp(2.2rem, 4vw, 3.4rem)/1.1 var(--bes-font-display)',
            letterSpacing: '-0.03em', color: '#001A41', margin: 0,
            maxWidth: 720, marginInline: 'auto', textWrap: 'balance',
          }}>
            Convierte la seguridad en confianza. <span style={{ color: '#0075F2' }}>Empieza hoy.</span>
          </h2>
          <p style={{
            font: '400 16px/1.6 var(--bes-font-body)', color: '#4B5563',
            margin: '20px auto 0', maxWidth: 540, textWrap: 'pretty',
          }}>
            Solicita una demo personalizada y descubre cómo BeAudit puede ayudarte
            a reducir riesgos, cumplir con confianza y escalar tu negocio.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 28 }}>
            <button style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '14px 26px', borderRadius: 12, border: 'none',
              background: '#0075F2', color: '#fff',
              font: '700 14px var(--bes-font-display)', cursor: 'pointer',
              boxShadow: '0 8px 22px rgba(0,117,242,0.28)',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              Solicitar demo personalizada
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
            <button style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '14px 22px', borderRadius: 12,
              background: '#fff', color: '#001A41',
              border: '1px solid rgba(0,26,65,0.12)',
              font: '700 14px var(--bes-font-display)', cursor: 'pointer',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              Ver plataforma en 2 min
            </button>
          </div>

          <div style={{
            display: 'flex', justifyContent: 'center', gap: 28, marginTop: 22,
            font: '500 12.5px var(--bes-font-body)', color: '#4B5563',
          }}>
            {['Demo adaptada a tu entorno', 'Resuelve tus dudas en directo', 'Sin compromiso, sin tarjeta'].map(t => (
              <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  width: 14, height: 14, borderRadius: '50%', background: '#0075F2',
                  display: 'inline-grid', placeItems: 'center', color: '#fff',
                }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                </span>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Two cards: testimonial + compliance */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24,
          marginTop: 32,
        }}>
          {/* Testimonial */}
          <div style={{
            background: '#F9FAFB', borderRadius: 16,
            padding: '28px 32px',
            border: '1px solid rgba(0,26,65,0.04)',
          }}>
            <div style={{ font: '900 36px/1 var(--bes-font-display)', color: 'rgba(0,26,65,0.18)', marginBottom: 6 }}>“</div>
            <p style={{
              font: '400 14.5px/1.6 var(--bes-font-body)',
              color: '#001A41', margin: 0, textWrap: 'pretty',
            }}>
              BeAudit nos ha permitido tener visibilidad total de nuestros riesgos
              y demostrar cumplimiento de forma sencilla y auditorable.<br/>Un antes y un después.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#94A3B8,#475569)',
                  display: 'grid', placeItems: 'center', color: '#fff',
                  font: '800 14px var(--bes-font-display)',
                }}>JM</div>
                <div>
                  <div style={{ font: '700 13px var(--bes-font-display)', color: '#001A41' }}>Jordi Martín</div>
                  <div style={{ font: '500 11.5px var(--bes-font-body)', color: '#4B5563' }}>CTO, Factorial</div>
                </div>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  width: 18, height: 18, borderRadius: '50%', background: '#FF6B57',
                  display: 'inline-block',
                }}/>
                <span style={{ font: '700 14px var(--bes-font-display)', color: '#001A41' }}>factorial</span>
              </div>
            </div>
          </div>

          {/* Compliance */}
          <div style={{
            background: '#F0F9FF', borderRadius: 16,
            padding: '28px 32px',
            border: '1px solid rgba(0,117,242,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: '#fff', boxShadow: '0 2px 6px rgba(0,26,65,0.08)',
                display: 'grid', placeItems: 'center', color: '#0075F2',
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div style={{ font: '800 16px var(--bes-font-display)', color: '#001A41', letterSpacing: '-0.02em' }}>
                Confianza que se demuestra
              </div>
            </div>
            <p style={{
              font: '400 13px/1.55 var(--bes-font-body)',
              color: '#4B5563', margin: '0 0 22px', textWrap: 'pretty',
            }}>
              BeAudit te ayuda a cumplir con los estándares más exigentes
              y a estar siempre listo para auditorías.
            </p>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
            }}>
              {[
                { label: 'SOC 2', sub: 'TYPE II', color: '#001A41' },
                { label: 'ISO', sub: '27001', color: '#001A41' },
                { label: 'GDPR', sub: '', color: '#001A41', stars: true },
                { label: 'HIPAA', sub: 'COMPLIANT', color: '#0075F2' },
              ].map((b, i) => (
                <div key={i} style={{
                  background: '#fff', borderRadius: 12,
                  border: '1px solid rgba(0,26,65,0.06)',
                  padding: '14px 8px', textAlign: 'center',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  minHeight: 78,
                }}>
                  {i === 3 ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0075F2" strokeWidth="1.6"><path d="M12 2v20M5 8c0 5 4 9 7 9s7-4 7-9c0-3-3-5-7-5S5 5 5 8z"/></svg>
                  ) : i === 2 ? (
                    <div style={{ display: 'flex', gap: 1, marginBottom: 2 }}>
                      {[0,1,2,3,4].map(j => (
                        <svg key={j} width="7" height="7" viewBox="0 0 24 24" fill="#FBBF24"><polygon points="12,2 14.5,9 22,9 16,13 18,21 12,17 6,21 8,13 2,9 9.5,9"/></svg>
                      ))}
                    </div>
                  ) : null}
                  <div style={{
                    font: '900 13px var(--bes-font-display)', color: b.color,
                    letterSpacing: '0.02em',
                  }}>{b.label}</div>
                  {b.sub && <div style={{
                    font: '600 8.5px var(--bes-font-body)', color: '#4B5563',
                    letterSpacing: '0.05em', marginTop: 2,
                  }}>{b.sub}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dark guarantee strip */}
        <div style={{
          marginTop: 28,
          background: '#001A41', borderRadius: 16,
          padding: '28px 36px',
          display: 'grid', gridTemplateColumns: '1fr 1.2fr auto', gap: 24, alignItems: 'center',
          color: '#fff',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'rgba(0,117,242,0.18)',
              display: 'grid', placeItems: 'center', color: '#60A5FA', flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <div style={{ font: '700 13px var(--bes-font-display)', color: '#fff', marginBottom: 4 }}>Garantía BeAudit</div>
              <div style={{ font: '400 11.5px/1.5 var(--bes-font-body)', color: 'rgba(255,255,255,0.65)' }}>
                Si después de tu demo no ves el valor,<br/>
                te lo diremos con total honestidad.<br/>
                Sin compromiso. Sin riesgos.
              </div>
            </div>
          </div>
          <div>
            <div style={{ font: '700 18px var(--bes-font-display)', color: '#fff', marginBottom: 4, letterSpacing: '-0.02em' }}>
              Tu seguridad. Tu cumplimiento. Tu ventaja.
            </div>
            <div style={{ font: '400 13px var(--bes-font-body)', color: 'rgba(255,255,255,0.65)' }}>
              Solicita tu demo hoy y da el primer paso.
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            <button style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 22px', borderRadius: 10, border: 'none',
              background: '#0075F2', color: '#fff',
              font: '700 13px var(--bes-font-display)', cursor: 'pointer',
              boxShadow: '0 6px 16px rgba(0,117,242,0.4)',
            }}>
              Solicitar demo ahora
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
            <div style={{
              font: '500 11px var(--bes-font-body)', color: 'rgba(255,255,255,0.6)',
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              100% confidencial
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BeAuditFooter() {
  return (
    <footer style={{
      marginTop: 56,
      background: '#001A41', color: '#fff',
      padding: '32px 48px',
    }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
      }}>
        <BeAuditLogo variant="light"/>
        <nav style={{ display: 'flex', gap: 36 }}>
          {['Producto', 'Soluciones', 'Recursos', 'Empresa', 'Contacto'].map(l => (
            <a key={l} href={`#${l}`} style={{
              font: '500 13px var(--bes-font-body)',
              color: 'rgba(255,255,255,0.75)', textDecoration: 'none',
            }}>{l}</a>
          ))}
        </nav>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 24,
          font: '500 12px var(--bes-font-body)', color: 'rgba(255,255,255,0.55)',
        }}>
          <span>BeServices · Barcelona · beservices.es</span>
          <a href="#li" style={{
            width: 26, height: 26, borderRadius: 5,
            background: 'rgba(255,255,255,0.08)',
            display: 'inline-grid', placeItems: 'center', color: '#fff',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h4v16H4zM6 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM10 8h4v2c.6-1.2 2-2.4 4-2.4 4 0 5 2.6 5 6V20h-4v-6c0-1.5-.5-2.5-2-2.5s-2.5 1-2.5 2.5V20h-4z"/></svg>
          </a>
          <a href="#x" style={{
            width: 26, height: 26, borderRadius: 5,
            background: 'rgba(255,255,255,0.08)',
            display: 'inline-grid', placeItems: 'center', color: '#fff',
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="m18 3 4 0-9 10 10 11h-7l-6-7-7 7H0l9-10L0 3h7l5 6z"/></svg>
          </a>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { FinalCTA, BeAuditFooter });
