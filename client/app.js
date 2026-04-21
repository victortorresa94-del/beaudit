'use strict';

/* ============================================================
   BeAudit — app.js
   SPA: landing -> loading -> dashboard
   Vanilla JS, zero dependencies
   ============================================================ */

// ── VIEW MANAGER ──────────────────────────────────────────────
const VIEWS = ['view-landing', 'view-loading', 'view-error', 'view-dashboard'];

function showView(id) {
  VIEWS.forEach(v => {
    const el = document.getElementById(v);
    if (el) el.style.display = (v === id) ? '' : 'none';
  });
  window.scrollTo(0, 0);
}

// ── LANDING ────────────────────────────────────────────────────
function goToLanding() {
  showView('view-landing');
}

// ── LOADING STEPS ──────────────────────────────────────────────
const STEPS = [
  'Conectando con Microsoft Graph API...',
  'Leyendo identidades y licencias...',
  'Analizando MFA y acceso condicional...',
  'Evaluando dispositivos y endpoint security...',
  'Calculando Secure Score...',
  'Generando diagnostico de riesgos...',
  'Preparando recomendaciones BeServices...'
];

let stepTimer = null;

function startLoadingAnimation() {
  const container = document.getElementById('loading-steps');
  if (!container) return;

  container.innerHTML = STEPS.map((s, i) =>
    '<div class="load-step" id="lstep-' + i + '">' +
      '<span class="lstep-dot"></span>' +
      '<span>' + s + '</span>' +
    '</div>'
  ).join('');

  let current = 0;

  function advance() {
    if (current > 0) {
      const prev = document.getElementById('lstep-' + (current - 1));
      if (prev) { prev.classList.remove('active'); prev.classList.add('done'); }
    }
    if (current < STEPS.length) {
      const cur = document.getElementById('lstep-' + current);
      if (cur) cur.classList.add('active');
      current++;
      stepTimer = setTimeout(advance, 600);
    }
  }

  advance();
}

function stopLoadingAnimation() {
  if (stepTimer) { clearTimeout(stepTimer); stepTimer = null; }
}

// ── AUDIT TRIGGER ──────────────────────────────────────────────
async function startAudit() {
  showView('view-loading');
  startLoadingAnimation();

  try {
    const res  = await fetch('/api/summary');
    const data = await res.json();

    stopLoadingAnimation();

    if (!res.ok || data.error) {
      showError(data.error || 'Error desconocido del servidor', data.hint || '');
      return;
    }

    renderDashboard(data);
    showView('view-dashboard');

  } catch (err) {
    stopLoadingAnimation();
    showError(err.message, 'Verifica que el servidor esta activo y las credenciales de la app en Azure son correctas.');
  }
}

// ── ERROR VIEW ─────────────────────────────────────────────────
function showError(msg, hint) {
  const msgEl  = document.getElementById('error-msg');
  const hintEl = document.getElementById('error-hint');
  if (msgEl)  msgEl.textContent  = msg  || 'Error desconocido';
  if (hintEl) hintEl.textContent = hint || '';
  showView('view-error');
}

// ── SCORE RING ─────────────────────────────────────────────────
function setScoreRing(score) {
  const ring = document.getElementById('score-ring-fg');
  if (!ring) return;

  const r    = 44;
  const circ = 2 * Math.PI * r;
  const pct  = Math.max(0, Math.min(100, score));
  const offset = circ * (1 - pct / 100);

  ring.setAttribute('stroke-dasharray',  circ.toFixed(1));
  ring.setAttribute('stroke-dashoffset', circ.toFixed(1));

  let colour = '#059669';
  if (pct < 40) colour = '#DC2626';
  else if (pct < 65) colour = '#D97706';
  ring.setAttribute('stroke', colour);

  setTimeout(() => {
    ring.setAttribute('stroke-dashoffset', offset.toFixed(1));
  }, 120);

  const valEl = document.getElementById('score-val-num');
  if (valEl) valEl.textContent = pct;
}

// ── RENDER DASHBOARD ───────────────────────────────────────────
function renderDashboard(data) {
  const { tenant, users, devices, security, risks, recommendation, generatedAt } = data;

  // Timestamp
  const ts = document.getElementById('dash-ts');
  if (ts) {
    const d = generatedAt ? new Date(generatedAt) : new Date();
    ts.textContent = d.toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  // Tenant pill
  const pill = document.getElementById('tenant-pill');
  if (pill && tenant) pill.textContent = tenant.displayName || tenant.id || '';

  // Score
  const score = risks && risks.score != null ? risks.score : 0;
  setScoreRing(score);

  const scoreLabel = document.getElementById('score-label');
  if (scoreLabel) {
    if (score >= 80)      scoreLabel.textContent = 'Riesgo Bajo';
    else if (score >= 55) scoreLabel.textContent = 'Riesgo Moderado';
    else if (score >= 35) scoreLabel.textContent = 'Riesgo Alto';
    else                  scoreLabel.textContent = 'Riesgo Critico';
  }

  const scoreDesc = document.getElementById('score-desc');
  if (scoreDesc) {
    const n = risks && risks.risks ? risks.risks.length : 0;
    scoreDesc.textContent = 'Se han detectado ' + n + ' hallazgo' + (n !== 1 ? 's' : '') + ' de seguridad en tu tenant de Microsoft 365.';
  }

  setEl('stat-critical', risks && risks.criticalCount != null ? risks.criticalCount : 0);
  setEl('stat-high',     risks && risks.highCount     != null ? risks.highCount     : 0);
  setEl('stat-covered',  risks && risks.coveredCount  != null ? risks.coveredCount  : 0);

  renderKpis(data);
  renderRisks(risks && risks.risks ? risks.risks : []);
  renderServices(security);
  renderCoverage(data);
  renderUsers(users);
  renderRecommendation(recommendation, risks);

  const footTenant = document.getElementById('foot-tenant');
  if (footTenant && tenant) footTenant.textContent = tenant.displayName || '';
}

// ── KPI ROW ────────────────────────────────────────────────────
function renderKpis(data) {
  const { users, devices, security, risks } = data;

  setEl('kpi-users-val', users && users.total != null ? users.total : '—');

  const mfaNo = users && users.withoutMfa != null ? users.withoutMfa : 0;
  const kpiUserBadge = document.getElementById('kpi-users-badge');
  if (kpiUserBadge) {
    kpiUserBadge.textContent = mfaNo > 0 ? mfaNo + ' sin MFA' : 'MFA OK';
    kpiUserBadge.className   = 'kpi-badge ' + (mfaNo > 0 ? 'risk' : 'ok');
  }

  const ss    = security && security.secureScore ? security.secureScore : null;
  const ssPct = ss && ss.currentScore != null && ss.maxScore
    ? Math.round((ss.currentScore / ss.maxScore) * 100) : null;

  setEl('kpi-score-val', ssPct != null ? ssPct + '%' : '—');

  const kpiScoreBadge = document.getElementById('kpi-score-badge');
  if (kpiScoreBadge) {
    if (ssPct == null)   { kpiScoreBadge.textContent = 'Sin datos'; kpiScoreBadge.className = 'kpi-badge neutral'; }
    else if (ssPct >= 70){ kpiScoreBadge.textContent = 'Bueno';     kpiScoreBadge.className = 'kpi-badge ok'; }
    else if (ssPct >= 45){ kpiScoreBadge.textContent = 'Mejorable'; kpiScoreBadge.className = 'kpi-badge warn'; }
    else                 { kpiScoreBadge.textContent = 'Critico';   kpiScoreBadge.className = 'kpi-badge risk'; }
  }

  const devTotal = devices && devices.total != null ? devices.total : 0;
  setEl('kpi-devices-val', devTotal);

  const kpiDevBadge = document.getElementById('kpi-devices-badge');
  if (kpiDevBadge) {
    if (!devices || !devices.available) {
      kpiDevBadge.textContent = 'Sin Intune'; kpiDevBadge.className = 'kpi-badge warn';
    } else {
      kpiDevBadge.textContent = devTotal > 0 ? 'Gestionados' : 'Sin dispositivos';
      kpiDevBadge.className   = 'kpi-badge ' + (devTotal > 0 ? 'ok' : 'neutral');
    }
  }

  const critCount  = risks && risks.criticalCount != null ? risks.criticalCount : 0;
  const risksTotal = risks && risks.risks         ? risks.risks.length          : 0;
  setEl('kpi-risks-val', risksTotal);

  const kpiRiskBadge = document.getElementById('kpi-risks-badge');
  if (kpiRiskBadge) {
    kpiRiskBadge.textContent = critCount > 0 ? critCount + ' critico' + (critCount > 1 ? 's' : '') : 'Sin criticos';
    kpiRiskBadge.className   = 'kpi-badge ' + (critCount > 0 ? 'risk' : 'ok');
  }
}

// ── RISKS ──────────────────────────────────────────────────────
var RISK_ICONS = {
  critical: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>',
  high:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  medium:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  info:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
};

var SEVERITY_LABEL = { critical: 'CRITICO', high: 'ALTO', medium: 'MEDIO', info: 'INFO' };

function renderRisks(risks) {
  const container = document.getElementById('risk-list');
  if (!container) return;

  if (!risks.length) {
    container.innerHTML = '<div style="padding:32px;text-align:center;color:var(--gray-400);font-size:.875rem;"><div style="font-size:2rem;margin-bottom:8px;">OK</div>No se han detectado riesgos destacables.</div>';
    return;
  }

  var order = { critical: 0, high: 1, medium: 2, info: 3 };
  var sorted = risks.slice().sort(function(a, b) {
    return (order[a.severity] != null ? order[a.severity] : 9) - (order[b.severity] != null ? order[b.severity] : 9);
  });

  container.innerHTML = sorted.map(function(r) {
    var icon  = RISK_ICONS[r.severity] || RISK_ICONS.info;
    var label = SEVERITY_LABEL[r.severity] || r.severity.toUpperCase();
    return '<div class="risk-item">' +
      '<div class="risk-icon ' + r.severity + '">' + icon + '</div>' +
      '<div class="risk-body">' +
        '<div class="risk-title">' + escHtml(r.title) + '</div>' +
        '<div class="risk-desc">'  + escHtml(r.description) + '</div>' +
      '</div>' +
      '<span class="risk-badge ' + r.severity + '">' + label + '</span>' +
    '</div>';
  }).join('');

  const meta = document.getElementById('risks-meta');
  if (meta) meta.textContent = risks.length + ' hallazgo' + (risks.length !== 1 ? 's' : '');
}

// ── SERVICES ───────────────────────────────────────────────────
function renderServices(security) {
  const container = document.getElementById('svc-grid');
  if (!container || !security) return;

  var SERVICES = [
    { key: 'conditionalAccess', label: 'Acceso Condicional' },
    { key: 'defenderOffice',    label: 'Defender for Office' },
    { key: 'intune',            label: 'Microsoft Intune' },
    { key: 'edr',               label: 'Defender Endpoint' },
    { key: 'purview',           label: 'Microsoft Purview' },
    { key: 'backup',            label: 'Backup M365' }
  ];

  container.innerHTML = SERVICES.map(function(s) {
    var val    = security[s.key];
    var status = 'off';
    var lbl    = 'No detectado';
    if (val === true || (val && val.enabled === true) || (Array.isArray(val) && val.length > 0)) {
      status = 'on'; lbl = 'Activo';
    } else if (val && (val.partial || val.enabled === 'partial')) {
      status = 'partial'; lbl = 'Parcial';
    }
    return '<div class="svc-item">' +
      '<span class="svc-dot ' + status + '"></span>' +
      '<span class="svc-name">' + escHtml(s.label) + '</span>' +
      '<span style="margin-left:auto;font-size:.7rem;color:var(--gray-400)">' + lbl + '</span>' +
    '</div>';
  }).join('');
}

// ── COVERAGE ───────────────────────────────────────────────────
function renderCoverage(data) {
  const container = document.getElementById('cov-list');
  if (!container) return;

  const users    = data.users    || {};
  const security = data.security || {};
  const risks    = data.risks    || {};

  const totalUsers = users.total      || 0;
  const withoutMfa = users.withoutMfa || 0;
  const withMfa    = Math.max(0, totalUsers - withoutMfa);
  const mfaPct     = totalUsers > 0 ? Math.round((withMfa / totalUsers) * 100) : 0;

  const ss    = security.secureScore || {};
  const ssPct = ss.currentScore != null && ss.maxScore
    ? Math.round((ss.currentScore / ss.maxScore) * 100) : 0;

  const critCount  = risks.criticalCount || 0;
  const risksTotal = risks.risks ? risks.risks.length : 0;
  const coveredPct = risksTotal > 0 ? Math.round(((risksTotal - critCount) / risksTotal) * 100) : 100;

  var BARS = [
    { label: 'Cobertura MFA',     pct: mfaPct,    cls: mfaPct >= 80    ? 'good' : mfaPct >= 50    ? 'warn' : 'bad' },
    { label: 'Secure Score',      pct: ssPct,     cls: ssPct >= 70     ? 'good' : ssPct >= 45     ? 'warn' : 'bad' },
    { label: 'Riesgos cubiertos', pct: coveredPct, cls: coveredPct >= 80 ? 'good' : coveredPct >= 50 ? 'warn' : 'bad' }
  ];

  container.innerHTML = BARS.map(function(b) {
    return '<div class="cov-row">' +
      '<div class="cov-header">' +
        '<span class="cov-label">' + b.label + '</span>' +
        '<span class="cov-pct">' + b.pct + '%</span>' +
      '</div>' +
      '<div class="bar-track">' +
        '<div class="bar-fill ' + b.cls + '" style="width:0%" data-target="' + b.pct + '"></div>' +
      '</div>' +
    '</div>';
  }).join('');

  requestAnimationFrame(function() {
    container.querySelectorAll('.bar-fill').forEach(function(el) {
      el.style.width = el.getAttribute('data-target') + '%';
    });
  });
}

// ── USERS TABLE ────────────────────────────────────────────────
function renderUsers(users) {
  const container = document.getElementById('user-list');
  const moreEl    = document.getElementById('users-more');
  if (!container || !users || !users.list || !users.list.length) return;

  var SHOW = 8;
  var list = users.list.slice(0, SHOW);

  container.innerHTML = list.map(function(u) {
    var initials = getInitials(u.displayName || u.userPrincipalName || '?');
    var hasMfa   = u.hasMfa === true;
    return '<div class="user-row">' +
      '<div class="user-avatar">' + initials + '</div>' +
      '<span class="user-name">' + escHtml(u.displayName || '—') + '</span>' +
      '<span class="user-email">' + escHtml(u.userPrincipalName || '') + '</span>' +
      '<span class="user-tag ' + (hasMfa ? 'mfa-ok' : 'mfa-no') + '">' + (hasMfa ? 'MFA' : 'Sin MFA') + '</span>' +
    '</div>';
  }).join('');

  if (moreEl) {
    var remaining = (users.total || 0) - SHOW;
    if (remaining > 0) { moreEl.style.display = ''; moreEl.textContent = '+' + remaining + ' usuarios mas en el tenant'; }
    else { moreEl.style.display = 'none'; }
  }

  const headerCount = document.getElementById('users-header-count');
  if (headerCount) headerCount.textContent = users.total || '';
}

// ── RECOMMENDATION ─────────────────────────────────────────────
var PRODUCT_DATA = {
  besafe_essentials: {
    name:     'Besafe Essentials',
    price:    'desde 15 EUR/usuario/mes',
    desc:     'Proteccion base para entornos Microsoft 365. Ideal para empresas con riesgos bajos y buenas practicas implementadas.',
    features: ['Gestion MFA y acceso condicional', 'Monitorizacion basica de seguridad', 'Soporte L1/L2 BeServices', 'Informes mensuales de estado']
  },
  besafe_advanced: {
    name:     'Besafe Advanced',
    price:    'desde 25 EUR/usuario/mes',
    desc:     'Seguridad avanzada para organizaciones con multiples riesgos criticos que necesitan proteccion activa.',
    features: ['Todo lo de Essentials', 'Defender for Office 365 P2', 'Microsoft Intune MDM/MAM', 'SOC monitorizando 24/7', 'Respuesta a incidentes']
  },
  besafe_plus: {
    name:     'Besafe Plus',
    price:    'desde 35 EUR/usuario/mes',
    desc:     'Continuidad de negocio y cumplimiento normativo. Anade backup y gobierno de datos a la proteccion avanzada.',
    features: ['Todo lo de Advanced', 'Backup M365 (Exchange, Teams, SharePoint)', 'Microsoft Purview Compliance', 'Retencion y eDiscovery', 'DLP y clasificacion de datos']
  },
  besafe_total: {
    name:     'Besafe Total',
    price:    'desde 45 EUR/usuario/mes',
    desc:     'Maxima proteccion para entornos con riesgo critico. Cobertura completa end-to-end de toda la superficie de ataque.',
    features: ['Todo lo de Plus', 'Defender for Endpoint P2 + EDR', 'Defender for Identity', 'Microsoft Sentinel SIEM', 'CISO virtual BeServices']
  }
};

var PRODUCT_ORDER = ['besafe_essentials', 'besafe_advanced', 'besafe_plus', 'besafe_total'];

function renderRecommendation(recommendation, risks) {
  const container = document.getElementById('recom-grid');
  const reasoning = document.getElementById('recom-reasoning');
  if (!container) return;

  var primary     = recommendation && recommendation.product ? recommendation.product : 'besafe_total';
  var primaryIdx  = PRODUCT_ORDER.indexOf(primary);
  var secondary   = primaryIdx < PRODUCT_ORDER.length - 1
    ? PRODUCT_ORDER[primaryIdx + 1]
    : PRODUCT_ORDER[primaryIdx - 1];

  var cards = [primary, secondary].filter(Boolean);

  container.innerHTML = cards.map(function(pid) {
    var p         = PRODUCT_DATA[pid];
    var isPrimary = pid === primary;
    if (!p) return '';

    var featuresHtml = p.features.map(function(f) { return '<li>' + escHtml(f) + '</li>'; }).join('');
    var footerBtn = isPrimary
      ? '<button class="btn-primary-sm" onclick="openContactModal(\'' + pid + '\')">Solicitar propuesta</button>'
      : '<button class="btn-outline"    onclick="openContactModal(\'' + pid + '\')">Ver detalles</button>';

    return '<div class="recom-card ' + (isPrimary ? 'primary' : '') + '">' +
      '<div class="recom-badge-wrap">' +
        '<span class="recom-badge ' + (isPrimary ? 'recommended' : '') + '">' +
          (isPrimary ? 'Recomendado' : 'Tambien disponible') +
        '</span>' +
      '</div>' +
      '<div class="recom-body">' +
        '<div class="recom-name">'  + escHtml(p.name)  + '</div>' +
        '<div class="recom-price">' + escHtml(p.price) + '</div>' +
        '<div class="recom-desc">'  + escHtml(p.desc)  + '</div>' +
        '<ul class="recom-features">' + featuresHtml + '</ul>' +
      '</div>' +
      '<div class="recom-footer">' + footerBtn + '</div>' +
    '</div>';
  }).join('');

  if (reasoning) {
    if (recommendation && recommendation.reasoning) {
      reasoning.style.display = '';
      reasoning.textContent   = recommendation.reasoning;
    } else {
      reasoning.style.display = 'none';
    }
  }
}

// ── MODAL ──────────────────────────────────────────────────────
function openContactModal(productId) {
  var p = PRODUCT_DATA[productId];
  if (!p) return;

  var body = document.getElementById('modal-body');
  if (!body) return;

  var checkIcon = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
  var closeIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  var featuresHtml = p.features.map(function(f) {
    return '<div class="modal-feature-item">' +
      '<span class="modal-feature-icon">' + checkIcon + '</span>' +
      escHtml(f) +
    '</div>';
  }).join('');

  body.innerHTML =
    '<div class="modal-header">' +
      '<button class="modal-x" onclick="closeModal()">' + closeIcon + '</button>' +
      '<h3>' + escHtml(p.name) + '</h3>' +
      '<p style="font-size:.875rem;color:var(--gray-500);margin-top:4px">' + escHtml(p.price) + '</p>' +
    '</div>' +
    '<div class="modal-body-content">' +
      '<div class="modal-section">' +
        '<h4>Que incluye</h4>' +
        '<div class="modal-feature-list">' + featuresHtml + '</div>' +
      '</div>' +
      '<div class="modal-section">' +
        '<p style="font-size:.875rem;color:var(--gray-500);line-height:1.7">' + escHtml(p.desc) + '</p>' +
      '</div>' +
    '</div>' +
    '<div class="modal-footer">' +
      '<a href="https://beservices.es/contacto" target="_blank" rel="noopener" class="btn-primary-sm" style="text-decoration:none;display:inline-flex;">' +
        'Hablar con un especialista' +
      '</a>' +
      '<button class="btn-outline" onclick="closeModal()" style="margin-left:10px">Cerrar</button>' +
    '</div>';

  var overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.style.display = 'flex';
}

function closeModal() {
  var overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.style.display = 'none';
}

// ── HELPERS ────────────────────────────────────────────────────
function setEl(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val != null ? val : '—';
}

function getInitials(name) {
  var parts = String(name).split(/\s+/).slice(0, 2);
  return parts.map(function(w) { return w[0] || ''; }).join('').toUpperCase() || '?';
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;');
}

// ── INIT ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  showView('view-landing');

  var overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeModal();
    });
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeModal();
  });

  window.startAudit       = startAudit;
  window.goToLanding      = goToLanding;
  window.openContactModal = openContactModal;
  window.closeModal       = closeModal;
});
