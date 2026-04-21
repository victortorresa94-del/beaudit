'use strict';

/* ============================================================
   BeAudit — app.js  v2
   SPA: landing -> loading -> dashboard
   Full detail: drawer, positives, layers, solution badges
   ============================================================ */

// ── GLOBALS ────────────────────────────────────────────────────
var _auditData = null;   // full API response stored here

// ── VIEWS ──────────────────────────────────────────────────────
var VIEWS = ['view-landing', 'view-loading', 'view-error', 'view-dashboard'];

function showView(id) {
  VIEWS.forEach(function(v) {
    var el = document.getElementById(v);
    if (el) el.style.display = (v === id) ? '' : 'none';
  });
  window.scrollTo(0, 0);
}

function goToLanding() { showView('view-landing'); }

// ── LOADING ────────────────────────────────────────────────────
var STEPS = [
  'Conectando con Microsoft Graph API...',
  'Leyendo identidades y licencias...',
  'Analizando MFA y acceso condicional...',
  'Evaluando dispositivos y endpoint security...',
  'Calculando Secure Score...',
  'Generando diagnostico de riesgos...',
  'Preparando recomendaciones BeServices...'
];
var stepTimer = null;

function startLoadingAnimation() {
  var container = document.getElementById('loading-steps');
  if (!container) return;
  container.innerHTML = STEPS.map(function(s, i) {
    return '<div class="load-step" id="lstep-' + i + '"><span class="lstep-dot"></span><span>' + s + '</span></div>';
  }).join('');
  var current = 0;
  function advance() {
    if (current > 0) {
      var prev = document.getElementById('lstep-' + (current - 1));
      if (prev) { prev.classList.remove('active'); prev.classList.add('done'); }
    }
    if (current < STEPS.length) {
      var cur = document.getElementById('lstep-' + current);
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
    var res  = await fetch('/api/summary');
    var data = await res.json();
    stopLoadingAnimation();
    if (!res.ok || data.error) {
      showError(data.error || 'Error desconocido del servidor', data.hint || '');
      return;
    }
    _auditData = data;
    renderDashboard(data);
    showView('view-dashboard');
  } catch (err) {
    stopLoadingAnimation();
    showError(err.message, 'Verifica que el servidor esta activo y las credenciales de la app en Azure son correctas.');
  }
}

// ── ERROR ──────────────────────────────────────────────────────
function showError(msg, hint) {
  setEl('error-msg',  msg  || 'Error desconocido');
  setEl('error-hint', hint || '');
  showView('view-error');
}

// ── SCORE RING ─────────────────────────────────────────────────
function setScoreRing(score) {
  var ring = document.getElementById('score-ring-fg');
  if (!ring) return;
  var r = 44, circ = 2 * Math.PI * r;
  var pct = Math.max(0, Math.min(100, score));
  ring.setAttribute('stroke-dasharray',  circ.toFixed(1));
  ring.setAttribute('stroke-dashoffset', circ.toFixed(1));
  var colour = '#059669';
  if (pct < 40) colour = '#DC2626';
  else if (pct < 65) colour = '#D97706';
  ring.setAttribute('stroke', colour);
  setTimeout(function() {
    ring.setAttribute('stroke-dashoffset', (circ * (1 - pct / 100)).toFixed(1));
  }, 120);
  setEl('score-val-num', pct);
}

// ── MAIN RENDER ────────────────────────────────────────────────
function renderDashboard(data) {
  var tenant   = data.tenant         || {};
  var users    = data.users          || {};
  var devices  = data.devices        || {};
  var security = data.security       || {};
  var risks    = data.risks          || {};
  var rec      = data.recommendation || {};
  var lics     = data.licenses       || [];
  var pos      = data.positives      || [];

  // Timestamp + tenant pill
  var ts = document.getElementById('dash-ts');
  if (ts && data.generatedAt) {
    ts.textContent = new Date(data.generatedAt).toLocaleString('es-ES', {day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
  }
  setEl('tenant-pill', tenant.displayName || tenant.primaryDomain || '');
  setEl('foot-tenant', tenant.displayName || '');

  // Score card
  var score = risks.score != null ? risks.score : 0;
  setScoreRing(score);
  var labelMap = [[80,'Riesgo Bajo'],[55,'Riesgo Moderado'],[35,'Riesgo Alto'],[0,'Riesgo Critico']];
  var lbl = 'Riesgo Critico';
  for (var li = 0; li < labelMap.length; li++) { if (score >= labelMap[li][0]) { lbl = labelMap[li][1]; break; } }
  setEl('score-label', lbl);
  var n = risks.risks ? risks.risks.length : 0;
  setEl('score-desc', 'Se han detectado ' + n + ' hallazgo' + (n !== 1 ? 's' : '') + ' de seguridad en tu tenant de Microsoft 365.');
  setEl('stat-critical', risks.criticalCount != null ? risks.criticalCount : 0);
  setEl('stat-high',     risks.highCount     != null ? risks.highCount     : 0);
  setEl('stat-covered',  risks.coveredCount  != null ? risks.coveredCount  : 0);

  // Render sections
  renderKpis(data);
  renderLayers(security, users, devices);
  renderRisks(risks.risks || []);
  renderServices(security);
  renderCoverage(data);
  renderPositives(pos);
  renderLicenses(lics);
  renderUsers(users);
  renderRecommendation(rec, risks);
}

// ── KPI ROW ────────────────────────────────────────────────────
function renderKpis(data) {
  var users = data.users || {}, devices = data.devices || {}, security = data.security || {}, risks = data.risks || {};

  setEl('kpi-users-val', users.total != null ? users.total : '—');
  var mfaNo = users.withoutMfa || 0;
  setBadge('kpi-users-badge', mfaNo > 0 ? mfaNo + ' sin MFA' : 'MFA OK', mfaNo > 0 ? 'risk' : 'ok');

  var ss = security.secureScore || {};
  var ssPct = ss.currentScore != null && ss.maxScore ? Math.round((ss.currentScore / ss.maxScore) * 100) : null;
  setEl('kpi-score-val', ssPct != null ? ssPct + '%' : '—');
  if (ssPct == null)   setBadge('kpi-score-badge', 'Sin datos', 'neutral');
  else if (ssPct >= 70) setBadge('kpi-score-badge', 'Bueno',     'ok');
  else if (ssPct >= 45) setBadge('kpi-score-badge', 'Mejorable', 'warn');
  else                  setBadge('kpi-score-badge', 'Critico',   'risk');

  setEl('kpi-devices-val', devices.total != null ? devices.total : 0);
  if (!devices.available) setBadge('kpi-devices-badge', 'Sin Intune', 'warn');
  else setBadge('kpi-devices-badge', devices.total > 0 ? 'Gestionados' : 'Sin datos', devices.total > 0 ? 'ok' : 'neutral');

  var riskArr = risks.risks || [];
  setEl('kpi-risks-val', riskArr.length);
  var crit = risks.criticalCount || 0;
  setBadge('kpi-risks-badge', crit > 0 ? crit + ' critico' + (crit > 1 ? 's' : '') : 'Sin criticos', crit > 0 ? 'risk' : 'ok');
}

// ── SECURITY LAYERS ────────────────────────────────────────────
function renderLayers(security, users, devices) {
  var container = document.getElementById('layers-grid');
  if (!container) return;

  var totalUsers = (users && users.total) || 1;
  var withoutMfa = (users && users.withoutMfa) || 0;
  var mfaPct = Math.round(((totalUsers - withoutMfa) / totalUsers) * 100);

  var ss     = (security && security.secureScore) || {};
  var ssPct  = ss.currentScore && ss.maxScore ? Math.round((ss.currentScore / ss.maxScore) * 100) : 0;

  var LAYERS = [
    {
      name: 'Identidad',
      detail: 'MFA + Acceso Condicional + Entra ID',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
      status: (mfaPct >= 80 && security.conditionalAccess) ? 'ok' : (mfaPct >= 50 || security.conditionalAccess) ? 'warn' : 'bad',
      statusText: mfaPct + '% MFA' + (security.conditionalAccess ? ' + CA' : ', sin CA')
    },
    {
      name: 'Email',
      detail: 'Defender for Office / anti-phishing',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
      status: security.defenderOffice ? 'ok' : 'bad',
      statusText: security.defenderOffice ? 'Defender activo' : 'Sin proteccion'
    },
    {
      name: 'Dispositivos',
      detail: 'Intune MDM + Defender Endpoint',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
      status: (security.intune && security.edr) ? 'ok' : (security.intune || security.edr) ? 'warn' : 'bad',
      statusText: security.intune ? (security.edr ? 'Intune + EDR' : 'Intune, sin EDR') : 'Sin gestion'
    },
    {
      name: 'Datos',
      detail: 'Purview / DLP / clasificacion',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
      status: security.purview ? 'ok' : 'bad',
      statusText: security.purview ? 'Purview activo' : 'Sin clasificacion'
    },
    {
      name: 'Backup',
      detail: 'Copia externa + recuperacion',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
      status: security.backup ? 'ok' : 'bad',
      statusText: security.backup ? (security.backupProvider || 'Activo') : 'Sin backup'
    }
  ];

  container.innerHTML = LAYERS.map(function(l) {
    return '<div class="layer-card ' + l.status + '">' +
      '<div class="layer-icon">' + l.icon + '</div>' +
      '<div class="layer-name">' + l.name + '</div>' +
      '<span class="layer-status">' + l.statusText + '</span>' +
      '<div class="layer-detail">' + l.detail + '</div>' +
    '</div>';
  }).join('');
}

// ── RISKS (with solution badges + clickable) ────────────────────
var RISK_ICONS = {
  critical: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>',
  high:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  medium:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  info:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
};
var SEV_LABEL = { critical: 'CRITICO', high: 'ALTO', medium: 'MEDIO', info: 'INFO' };
var BS_NAMES  = { besafe_essentials: 'Besafe Essentials', besafe_advanced: 'Besafe Advanced', besafe_plus: 'Besafe Plus', besafe_total: 'Besafe Total' };

var CHEVRON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="9 18 15 12 9 6"/></svg>';

function renderRisks(risks) {
  var container = document.getElementById('risk-list');
  if (!container) return;

  if (!risks.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">OK</div>No se han detectado riesgos. Buen trabajo.</div>';
    return;
  }

  var order = { critical:0, high:1, medium:2, info:3 };
  var sorted = risks.slice().sort(function(a,b) { return (order[a.severity]||9)-(order[b.severity]||9); });

  container.innerHTML = sorted.map(function(r) {
    var bsName = BS_NAMES[r.beservicesFix] || r.beservicesFix || '';
    var tags = '<div class="risk-tags">' +
      (r.microsoftFix  ? '<span class="sol-badge ms">MS: ' + escHtml(r.microsoftFix)  + '</span>' : '') +
      (bsName          ? '<span class="sol-badge bs">'     + escHtml(bsName)           + '</span>' : '') +
    '</div>';

    return '<div class="risk-item clickable" onclick="openRiskDetail(\'' + r.id + '\')">' +
      '<div class="risk-icon ' + r.severity + '">' + (RISK_ICONS[r.severity] || RISK_ICONS.info) + '</div>' +
      '<div class="risk-body">' +
        '<div class="risk-title">' + escHtml(r.title) + '</div>' +
        '<div class="risk-desc">'  + escHtml(r.description) + '</div>' +
        tags +
      '</div>' +
      '<span class="risk-badge ' + r.severity + '">' + (SEV_LABEL[r.severity] || r.severity) + '</span>' +
      '<span class="risk-chevron">' + CHEVRON + '</span>' +
    '</div>';
  }).join('');

  setEl('risks-meta', risks.length + ' hallazgo' + (risks.length !== 1 ? 's' : ''));
}

// ── SERVICES ───────────────────────────────────────────────────
function renderServices(security) {
  var container = document.getElementById('svc-grid');
  if (!container || !security) return;
  var SVC = [
    { key: 'conditionalAccess', label: 'Acceso Condicional' },
    { key: 'defenderOffice',    label: 'Defender for Office' },
    { key: 'intune',            label: 'Microsoft Intune' },
    { key: 'edr',               label: 'Defender Endpoint' },
    { key: 'purview',           label: 'Microsoft Purview' },
    { key: 'backup',            label: 'Backup M365' }
  ];
  container.innerHTML = SVC.map(function(s) {
    var val = security[s.key];
    var on  = (val === true || (val && val.enabled === true) || (Array.isArray(val) && val.length > 0));
    var cls = on ? 'on' : 'off';
    var lbl = on ? 'Activo' : 'No detectado';
    return '<div class="svc-item"><span class="svc-dot ' + cls + '"></span><span class="svc-name">' + s.label + '</span><span style="margin-left:auto;font-size:.7rem;color:var(--gray-400)">' + lbl + '</span></div>';
  }).join('');
}

// ── COVERAGE BARS ──────────────────────────────────────────────
function renderCoverage(data) {
  var container = document.getElementById('cov-list');
  if (!container) return;
  var users = data.users || {}, security = data.security || {}, risks = data.risks || {};
  var total    = users.total || 0;
  var mfaPct   = total > 0 ? Math.round(((total - (users.withoutMfa||0)) / total) * 100) : 0;
  var ss       = security.secureScore || {};
  var ssPct    = ss.currentScore && ss.maxScore ? Math.round((ss.currentScore / ss.maxScore) * 100) : 0;
  var rn       = risks.risks ? risks.risks.length : 0;
  var cov      = rn > 0 ? Math.round(((rn - (risks.criticalCount||0)) / rn) * 100) : 100;
  var BARS = [
    { label: 'Cobertura MFA',     pct: mfaPct, cls: mfaPct >= 80 ? 'good' : mfaPct >= 50 ? 'warn' : 'bad' },
    { label: 'Secure Score',      pct: ssPct,  cls: ssPct  >= 70 ? 'good' : ssPct  >= 45 ? 'warn' : 'bad' },
    { label: 'Riesgos cubiertos', pct: cov,    cls: cov    >= 80 ? 'good' : cov    >= 50 ? 'warn' : 'bad' }
  ];
  container.innerHTML = BARS.map(function(b) {
    return '<div class="cov-row"><div class="cov-header"><span class="cov-label">' + b.label + '</span><span class="cov-pct">' + b.pct + '%</span></div><div class="bar-track"><div class="bar-fill ' + b.cls + '" style="width:0%" data-target="' + b.pct + '"></div></div></div>';
  }).join('');
  requestAnimationFrame(function() {
    container.querySelectorAll('.bar-fill').forEach(function(el) { el.style.width = el.getAttribute('data-target') + '%'; });
  });
}

// ── POSITIVES ──────────────────────────────────────────────────
var POS_ICONS = {
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  lock:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>',
  device: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
  chart:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  save:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
  mail:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
  cpu:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/></svg>',
  check:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'
};

function renderPositives(pos) {
  var grid = document.getElementById('positives-grid');
  var meta = document.getElementById('positives-meta');
  if (!grid) return;
  if (!pos || !pos.length) {
    grid.innerHTML = '<div class="empty-state">No se han detectado controles de seguridad activos.</div>';
    return;
  }
  if (meta) meta.textContent = pos.length + ' control' + (pos.length !== 1 ? 'es' : '') + ' activo' + (pos.length !== 1 ? 's' : '');
  grid.innerHTML = pos.map(function(p) {
    var icon = POS_ICONS[p.icon] || POS_ICONS.check;
    return '<div class="positive-item"><div class="pos-icon">' + icon + '</div><div class="pos-body"><div class="pos-title">' + escHtml(p.title) + '</div><div class="pos-detail">' + escHtml(p.detail) + '</div></div></div>';
  }).join('');
}

// ── LICENSES ───────────────────────────────────────────────────
function renderLicenses(lics) {
  var container = document.getElementById('lic-list');
  var meta      = document.getElementById('lic-meta');
  if (!container) return;
  if (!lics || !lics.length) {
    container.innerHTML = '<div class="empty-state">No se han encontrado licencias.</div>';
    return;
  }
  var active = lics.filter(function(l) { return l.consumedUnits > 0; });
  if (meta) meta.textContent = active.length + ' activa' + (active.length !== 1 ? 's' : '') + ' de ' + lics.length + ' total';
  container.innerHTML = active.map(function(l) {
    return '<div class="lic-row"><span class="lic-dot"></span><span class="lic-name">' + escHtml(l.name || l.skuPartNumber) + '</span><span class="lic-count">' + l.consumedUnits + ' / ' + l.enabledUnits + ' uds.</span></div>';
  }).join('');
}

// ── USERS TABLE ────────────────────────────────────────────────
function renderUsers(users) {
  var container = document.getElementById('user-list');
  var moreEl    = document.getElementById('users-more');
  if (!container || !users || !users.list || !users.list.length) return;
  var SHOW = 8, list = users.list.slice(0, SHOW);
  container.innerHTML = list.map(function(u) {
    return '<div class="user-row">' +
      '<div class="user-avatar">' + getInitials(u.displayName || u.userPrincipalName || '?') + '</div>' +
      '<span class="user-name">'  + escHtml(u.displayName || '—') + '</span>' +
      '<span class="user-email">' + escHtml(u.userPrincipalName || '') + '</span>' +
      '<span class="user-tag ' + (u.hasMfa ? 'mfa-ok' : 'mfa-no') + '">' + (u.hasMfa ? 'MFA' : 'Sin MFA') + '</span>' +
    '</div>';
  }).join('');
  setEl('users-header-count', users.total || '');
  if (moreEl) {
    var rem = (users.total || 0) - SHOW;
    if (rem > 0) { moreEl.style.display = ''; moreEl.textContent = '+' + rem + ' usuarios mas'; }
    else moreEl.style.display = 'none';
  }
}

// ── RECOMMENDATION ─────────────────────────────────────────────
var PRODUCT_DATA = {
  besafe_essentials: { name:'Besafe Essentials', price:'desde 15 EUR/usuario/mes', desc:'Proteccion base para Microsoft 365. Ideal para empresas con riesgos bajos y buenas practicas implementadas.', features:['Gestion MFA y acceso condicional','Monitorizacion basica de seguridad','Soporte L1/L2 BeServices','Informes mensuales de estado'] },
  besafe_advanced:   { name:'Besafe Advanced',   price:'desde 25 EUR/usuario/mes', desc:'Seguridad avanzada para organizaciones con multiples riesgos criticos.', features:['Todo lo de Essentials','Defender for Office 365 P2','Microsoft Intune MDM/MAM','SOC 24/7','Respuesta a incidentes'] },
  besafe_plus:       { name:'Besafe Plus',        price:'desde 35 EUR/usuario/mes', desc:'Continuidad de negocio y cumplimiento normativo con backup incluido.', features:['Todo lo de Advanced','Backup M365 (Exchange, Teams, SharePoint)','Microsoft Purview Compliance','Retencion y eDiscovery'] },
  besafe_total:      { name:'Besafe Total',        price:'desde 45 EUR/usuario/mes', desc:'Maxima proteccion para entornos con riesgo critico. Cobertura end-to-end.', features:['Todo lo de Plus','Defender for Endpoint P2 + EDR','Defender for Identity','Microsoft Sentinel SIEM','CISO virtual BeServices'] }
};
var PRODUCT_ORDER = ['besafe_essentials','besafe_advanced','besafe_plus','besafe_total'];

function renderRecommendation(rec, risks) {
  var container = document.getElementById('recom-grid');
  var reasoning = document.getElementById('recom-reasoning');
  if (!container) return;
  var primary    = rec.product || 'besafe_total';
  var pidx       = PRODUCT_ORDER.indexOf(primary);
  var secondary  = pidx < PRODUCT_ORDER.length - 1 ? PRODUCT_ORDER[pidx + 1] : PRODUCT_ORDER[pidx - 1];

  container.innerHTML = [primary, secondary].filter(Boolean).map(function(pid) {
    var p = PRODUCT_DATA[pid]; if (!p) return '';
    var isPrimary = pid === primary;
    return '<div class="recom-card ' + (isPrimary ? 'primary' : '') + '">' +
      '<div class="recom-badge-wrap"><span class="recom-badge ' + (isPrimary ? 'recommended' : '') + '">' + (isPrimary ? 'Recomendado' : 'Tambien disponible') + '</span></div>' +
      '<div class="recom-body">' +
        '<div class="recom-name">'  + escHtml(p.name)  + '</div>' +
        '<div class="recom-price">' + escHtml(p.price) + '</div>' +
        '<div class="recom-desc">'  + escHtml(p.desc)  + '</div>' +
        '<ul class="recom-features">' + p.features.map(function(f) { return '<li>' + escHtml(f) + '</li>'; }).join('') + '</ul>' +
      '</div>' +
      '<div class="recom-footer">' +
        (isPrimary ? '<button class="btn-primary-sm" onclick="openContactModal(\'' + pid + '\')">Solicitar propuesta</button>' : '<button class="btn-outline" onclick="openContactModal(\'' + pid + '\')">Ver detalles</button>') +
      '</div>' +
    '</div>';
  }).join('');

  if (reasoning) {
    reasoning.textContent   = rec.reasoning || '';
    reasoning.style.display = rec.reasoning ? '' : 'none';
  }
}

// ============================================================
//   DETAIL DRAWER
// ============================================================

function openRiskDetail(riskId) {
  if (!_auditData) return;
  var risks = (_auditData.risks && _auditData.risks.risks) || [];
  var risk  = null;
  for (var i = 0; i < risks.length; i++) { if (risks[i].id === riskId) { risk = risks[i]; break; } }
  if (!risk) return;

  var content = document.getElementById('drawer-content');
  if (!content) return;

  content.innerHTML = buildDrawerHTML(risk, _auditData);

  var drawer = document.getElementById('detail-drawer');
  if (drawer) drawer.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  var drawer = document.getElementById('detail-drawer');
  if (drawer) drawer.classList.remove('open');
  document.body.style.overflow = '';
}

function buildDrawerHTML(risk, data) {
  var sev      = risk.severity || 'info';
  var sevLabel = SEV_LABEL[sev] || sev.toUpperCase();
  var sevColour= { critical:'#DC2626', high:'#D97706', medium:'#CA8A04', info:'#0075F2' }[sev] || '#0075F2';
  var icon     = RISK_ICONS[sev] || RISK_ICONS.info;
  var bsName   = BS_NAMES[risk.beservicesFix] || risk.beservicesFix || '';

  var header =
    '<div class="drawer-header">' +
      '<div class="drawer-header-icon" style="border:1.5px solid rgba(255,255,255,.2)">' + icon + '</div>' +
      '<div class="drawer-header-text">' +
        '<h3>' + escHtml(risk.title) + '</h3>' +
        '<p>Area afectada: ' + escHtml(risk.affectedArea || '—') + '</p>' +
      '</div>' +
      '<span class="drawer-sev-pill" style="background:' + sevColour + '">' + sevLabel + '</span>' +
      '<button class="drawer-close" onclick="closeDrawer()">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button>' +
    '</div>';

  var descSection =
    '<div class="drawer-section">' +
      '<div class="drawer-section-title">Descripcion del riesgo</div>' +
      '<div class="drawer-desc">' + escHtml(risk.description) + '</div>' +
    '</div>';

  var dataSection = buildRiskDataSection(risk, data);

  var fixSection =
    '<div class="drawer-section">' +
      '<div class="drawer-section-title">Como resolver este riesgo</div>' +
      (risk.microsoftFix ?
        '<div class="fix-card">' +
          '<div class="fix-icon ms"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg></div>' +
          '<div class="fix-body"><div class="fix-label">Solucion Microsoft</div><div class="fix-name">' + escHtml(risk.microsoftFix) + '</div><div class="fix-desc">Licencia o configuracion de Microsoft 365 necesaria para cubrir este riesgo.</div></div>' +
        '</div>' : '') +
      (bsName ?
        '<div class="fix-card">' +
          '<div class="fix-icon bs"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>' +
          '<div class="fix-body"><div class="fix-label">Plan BeServices incluye esto</div><div class="fix-name">' + escHtml(bsName) + '</div><div class="fix-desc">BeServices implanta y gestiona esta capa de seguridad de manera continua.</div></div>' +
        '</div>' : '') +
    '</div>';

  var footer =
    '<div class="drawer-footer">' +
      '<a href="https://beservices.es/contacto" target="_blank" rel="noopener" class="btn-primary-sm" style="text-decoration:none;display:inline-flex">Solicitar solucion</a>' +
      '<button class="btn-outline" onclick="closeDrawer()">Cerrar</button>' +
    '</div>';

  return '<div class="drawer-body">' + header + descSection + dataSection + fixSection + '</div>' + footer;
}

// Per-risk real data sections
function buildRiskDataSection(risk, data) {
  var users   = data.users   || {};
  var devices = data.devices || {};
  var security= data.security|| {};

  switch (risk.id) {

    case 'mfa_disabled': {
      var userList  = (users.list || []).filter(function(u) { return !u.hasMfa; });
      var total     = users.total || 0;
      var withMfa   = users.withMfa || (total - (users.withoutMfa || 0));
      var pct       = total > 0 ? Math.round((withMfa / total) * 100) : 0;
      var stats =
        '<div class="drawer-stats">' +
          '<div class="drawer-stat bad"><div class="drawer-stat-val">' + userList.length + '</div><div class="drawer-stat-lbl">Sin MFA</div></div>' +
          '<div class="drawer-stat ok"><div class="drawer-stat-val">'  + withMfa        + '</div><div class="drawer-stat-lbl">Con MFA</div></div>' +
          '<div class="drawer-stat ' + (pct >= 80 ? 'ok' : pct >= 50 ? 'warn' : 'bad') + '"><div class="drawer-stat-val">' + pct + '%</div><div class="drawer-stat-lbl">Cobertura</div></div>' +
        '</div>';
      var rows = userList.slice(0, 30).map(function(u) {
        return '<tr><td><span class="dt-avatar">' + getInitials(u.displayName || '?') + '</span><span class="dt-name">' + escHtml(u.displayName || '—') + '</span><br><span class="dt-email">' + escHtml(u.userPrincipalName || '') + '</span></td><td><span class="dt-badge bad">Sin MFA</span></td></tr>';
      }).join('');
      return '<div class="drawer-section">' + stats + '</div>' +
        '<div class="drawer-section">' +
          '<div class="drawer-section-title">Usuarios sin autenticacion multifactor (' + userList.length + ')</div>' +
          '<table class="detail-table"><thead><tr><th>Usuario</th><th>Estado MFA</th></tr></thead><tbody>' + rows + '</tbody></table>' +
          (userList.length > 30 ? '<div style="padding:10px 12px;font-size:.78rem;color:var(--gray-400)">... y ' + (userList.length - 30) + ' mas</div>' : '') +
        '</div>';
    }

    case 'no_conditional_access': {
      var caCount   = security.caCount   || 0;
      var caEnabled = security.caEnabled || 0;
      var stats2 =
        '<div class="drawer-stats">' +
          '<div class="drawer-stat bad"><div class="drawer-stat-val">' + caCount   + '</div><div class="drawer-stat-lbl">Politicas totales</div></div>' +
          '<div class="drawer-stat bad"><div class="drawer-stat-val">' + caEnabled + '</div><div class="drawer-stat-lbl">Activas</div></div>' +
        '</div>';
      var explain =
        '<div class="drawer-section">' +
          '<div class="drawer-section-title">Que significa esto</div>' +
          '<div style="font-size:.875rem;color:var(--gray-600);line-height:1.7">' +
            '<p style="margin-bottom:10px">Sin politicas de Acceso Condicional, cualquier usuario con credenciales validas puede acceder desde <strong>cualquier dispositivo, ubicacion o red</strong> sin restricciones adicionales.</p>' +
            '<p>El Acceso Condicional de Entra ID permite definir reglas como: bloquear acceso desde paises de riesgo, requerir dispositivo gestionado, forzar MFA en aplicaciones criticas, etc.</p>' +
          '</div>' +
        '</div>';
      return '<div class="drawer-section">' + stats2 + '</div>' + explain;
    }

    case 'no_intune': {
      var devTotal  = devices.total      || 0;
      var devComp   = devices.compliant  || 0;
      var devNonC   = devices.nonCompliant || 0;
      var devList   = (devices.nonCompliantList || devices.list || []).slice(0, 20);
      var stats3 =
        '<div class="drawer-stats">' +
          '<div class="drawer-stat"><div class="drawer-stat-val">'     + devTotal + '</div><div class="drawer-stat-lbl">Total</div></div>' +
          '<div class="drawer-stat ok"><div class="drawer-stat-val">'  + devComp  + '</div><div class="drawer-stat-lbl">Conformes</div></div>' +
          '<div class="drawer-stat warn"><div class="drawer-stat-val">'+ devNonC  + '</div><div class="drawer-stat-lbl">No conformes</div></div>' +
        '</div>';
      var devRows = devList.map(function(d) {
        var cls = d.complianceState === 'compliant' ? 'ok' : 'warn';
        return '<tr><td class="dt-name">' + escHtml(d.name||'—') + '</td><td>' + escHtml(d.os||'—') + '</td><td><span class="dt-badge ' + cls + '">' + escHtml(d.complianceState||'—') + '</span></td></tr>';
      }).join('');
      return '<div class="drawer-section">' + stats3 + '</div>' +
        (devRows ? '<div class="drawer-section"><div class="drawer-section-title">Dispositivos detectados</div><table class="detail-table"><thead><tr><th>Nombre</th><th>OS</th><th>Estado</th></tr></thead><tbody>' + devRows + '</tbody></table></div>' : '');
    }

    case 'no_backup': {
      var totalU = users.total || 0;
      var explain2 =
        '<div class="drawer-section">' +
          '<div class="drawer-section-title">Datos en riesgo</div>' +
          '<div style="font-size:.875rem;color:var(--gray-600);line-height:1.7;margin-bottom:16px">' +
            '<p>Microsoft <strong>no realiza copias de seguridad</strong> de tus datos de Microsoft 365. Si un usuario borra correos, archivos o datos de forma accidental o por ransomware, la recuperacion puede ser imposible.</p>' +
          '</div>' +
          '<div class="drawer-stats">' +
            '<div class="drawer-stat"><div class="drawer-stat-val">' + totalU + '</div><div class="drawer-stat-lbl">Buzon de correo</div></div>' +
            '<div class="drawer-stat"><div class="drawer-stat-val">' + totalU + '</div><div class="drawer-stat-lbl">OneDrives</div></div>' +
            '<div class="drawer-stat bad"><div class="drawer-stat-val">0</div><div class="drawer-stat-lbl">Backups activos</div></div>' +
          '</div>' +
        '</div>';
      return explain2;
    }

    case 'no_defender_office': {
      var lics = data.licenses || [];
      var emailLics = lics.filter(function(l) { return l.consumedUnits > 0; }).slice(0, 8);
      var licRows = emailLics.map(function(l) {
        return '<tr><td class="dt-name">' + escHtml(l.name||l.skuPartNumber) + '</td><td>' + l.consumedUnits + ' activas</td><td><span class="dt-badge warn">Sin Defender</span></td></tr>';
      }).join('');
      var explain3 =
        '<div class="drawer-section">' +
          '<div class="drawer-section-title">Por que es critico</div>' +
          '<div style="font-size:.875rem;color:var(--gray-600);line-height:1.7">' +
            '<p>El <strong>91% de los ciberataques</strong> empieza con un email. Sin Defender for Office, no hay proteccion contra phishing avanzado, malware adjunto, ni suplantacion de dominio.</p>' +
          '</div>' +
        '</div>' +
        (licRows ? '<div class="drawer-section"><div class="drawer-section-title">Licencias activas (sin Defender for Office)</div><table class="detail-table"><thead><tr><th>Plan</th><th>Cantidad</th><th>Estado</th></tr></thead><tbody>' + licRows + '</tbody></table></div>' : '');
      return explain3;
    }

    case 'no_edr': {
      var devList2 = (devices.list || []).slice(0, 15);
      var stats4 =
        '<div class="drawer-section"><div class="drawer-section-title">Dispositivos sin EDR detectados</div>' +
        (devList2.length ?
          '<table class="detail-table"><thead><tr><th>Nombre</th><th>OS</th><th>Ultima sincronizacion</th></tr></thead><tbody>' +
          devList2.map(function(d) {
            var ls = d.lastSync ? new Date(d.lastSync).toLocaleDateString('es-ES') : '—';
            return '<tr><td class="dt-name">' + escHtml(d.name||'—') + '</td><td>' + escHtml(d.os||'—') + '</td><td style="font-size:.78rem;color:var(--gray-400)">' + ls + '</td></tr>';
          }).join('') + '</tbody></table>' :
          '<div style="font-size:.875rem;color:var(--gray-600);padding:8px 0">Sin datos de dispositivos disponibles (Intune no configurado).</div>') +
        '</div>';
      return stats4;
    }

    case 'external_sharing': {
      var ext = (data.security && data.security.externalSharing) || {};
      var stats5 =
        '<div class="drawer-stats">' +
          '<div class="drawer-stat"><div class="drawer-stat-val">'     + (ext.totalSites||0)      + '</div><div class="drawer-stat-lbl">Sitios SharePoint</div></div>' +
          '<div class="drawer-stat warn"><div class="drawer-stat-val">'+ (ext.sitesWithExternal||0)+ '</div><div class="drawer-stat-lbl">Con sharing externo</div></div>' +
        '</div>';
      return '<div class="drawer-section">' + stats5 + '</div>' +
        '<div class="drawer-section"><div class="drawer-section-title">Que implica</div>' +
        '<div style="font-size:.875rem;color:var(--gray-600);line-height:1.7">Los archivos en estos sitios pueden ser compartidos con usuarios externos sin autenticacion o con cuentas de invitado no gestionadas, sin logs centralizados ni politicas de expiracion de enlaces.</div></div>';
    }

    case 'low_secure_score': {
      var ss2 = (data.security && data.security.secureScore) || {};
      var pct2 = ss2.percentage || 0;
      var stats6 =
        '<div class="drawer-stats">' +
          '<div class="drawer-stat bad"><div class="drawer-stat-val">' + pct2 + '%</div><div class="drawer-stat-lbl">Tu puntuacion</div></div>' +
          '<div class="drawer-stat"><div class="drawer-stat-val">' + (ss2.currentScore||0) + '</div><div class="drawer-stat-lbl">Puntos actuales</div></div>' +
          '<div class="drawer-stat"><div class="drawer-stat-val">' + (ss2.maxScore||0) + '</div><div class="drawer-stat-lbl">Puntos maximos</div></div>' +
        '</div>';
      return '<div class="drawer-section">' + stats6 + '</div>' +
        '<div class="drawer-section"><div class="drawer-section-title">Que evalua Microsoft Secure Score</div>' +
        '<div style="font-size:.875rem;color:var(--gray-600);line-height:1.7">Microsoft analiza cientos de configuraciones de seguridad en tu tenant. Una puntuacion baja indica que hay multiples controles de seguridad sin configurar o con configuraciones debiles que aumentan la superficie de ataque.</div></div>';
    }

    default: {
      return '<div class="drawer-section"><div class="drawer-section-title">Detalle del hallazgo</div><div class="drawer-desc">' + escHtml(risk.description) + '</div></div>';
    }
  }
}

// ── CONTACT MODAL ──────────────────────────────────────────────
function openContactModal(productId) {
  var p = PRODUCT_DATA[productId]; if (!p) return;
  var body = document.getElementById('modal-body'); if (!body) return;
  var checkIcon = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
  var closeIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  body.innerHTML =
    '<div class="modal-header">' +
      '<button class="modal-x" onclick="closeModal()">' + closeIcon + '</button>' +
      '<h3>' + escHtml(p.name) + '</h3>' +
      '<p style="font-size:.875rem;color:var(--gray-500);margin-top:4px">' + escHtml(p.price) + '</p>' +
    '</div>' +
    '<div class="modal-body-content">' +
      '<div class="modal-section"><h4>Que incluye</h4><div class="modal-feature-list">' +
        p.features.map(function(f) { return '<div class="modal-feature-item"><span class="modal-feature-icon">' + checkIcon + '</span>' + escHtml(f) + '</div>'; }).join('') +
      '</div></div>' +
      '<div class="modal-section"><p style="font-size:.875rem;color:var(--gray-500);line-height:1.7">' + escHtml(p.desc) + '</p></div>' +
    '</div>' +
    '<div class="modal-footer">' +
      '<a href="https://beservices.es/contacto" target="_blank" rel="noopener" class="btn-primary-sm" style="text-decoration:none;display:inline-flex">Hablar con un especialista</a>' +
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
function setEl(id, val) { var el = document.getElementById(id); if (el) el.textContent = val != null ? val : '—'; }
function setBadge(id, text, cls) { var el = document.getElementById(id); if (el) { el.textContent = text; el.className = 'kpi-badge ' + (cls||'neutral'); } }
function getInitials(name) { return String(name).split(/\s+/).slice(0,2).map(function(w){return w[0]||'';}).join('').toUpperCase()||'?'; }
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── INIT ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  showView('view-landing');

  var overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.addEventListener('click', function(e) { if (e.target === overlay) closeModal(); });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') { closeDrawer(); closeModal(); }
  });

  window.startAudit       = startAudit;
  window.goToLanding      = goToLanding;
  window.openRiskDetail   = openRiskDetail;
  window.closeDrawer      = closeDrawer;
  window.openContactModal = openContactModal;
  window.closeModal       = closeModal;
});
