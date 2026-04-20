'use strict';

/* ============================================================
   BeAudit — app.js
   Vanilla JS — zero dependencies
   ============================================================ */

const AVATAR_COLORS = ['#1A73E8','#7C3AED','#059669','#DC2626','#D97706','#0891B2','#DB2777'];

function getAvatarColor(name, index) {
  if (index !== undefined) return AVATAR_COLORS[index % AVATAR_COLORS.length];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} · ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}h`;
}

function formatDateShort(isoStr) {
  if (!isoStr) return new Date().toLocaleDateString('es-ES');
  return new Date(isoStr).toLocaleDateString('es-ES');
}

// ---------- ICONS ----------
const ICONS = {
  identity: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>`,
  email: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  devices: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
  data: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
  backup: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  licenses: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  ok: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
  warning: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
};

function areaIcon(area, colorClass) {
  const map = { 'Identidad': 'identity', 'Email': 'email', 'Dispositivos': 'devices', 'Datos': 'data', 'Backup': 'backup', 'General': 'shield', 'Licencias': 'licenses' };
  const key = map[area] || 'shield';
  const strokeColor = colorClass === 'red' ? '#DC2626' : colorClass === 'amber' ? '#D97706' : colorClass === 'blue' ? '#2563EB' : colorClass === 'green' ? '#059669' : '#6B7280';
  return ICONS[key].replace('stroke-width="2"', `stroke="${strokeColor}" stroke-width="2"`);
}

function levelToIconClass(level) {
  return { critical: 'red', high: 'amber', medium: 'blue', info: 'gray', ok: 'green' }[level] || 'gray';
}

function levelBadgeLabel(level) {
  return { critical: 'CRÍTICO', high: 'ALTO', medium: 'MEDIO', info: 'INFO' }[level] || level.toUpperCase();
}

// ---------- RENDER FUNCTIONS ----------

function renderHeader(data) {
  const el = document.getElementById('header');
  const domain = data.tenant?.primaryDomain || data.tenant?.verifiedDomains?.[0] || '—';
  const displayName = data.tenant?.displayName || 'Tenant desconocido';
  el.innerHTML = `
    <div class="header">
      <div class="header-left">
        <div class="logo">
          <div class="logo-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div class="logo-text">Be<span>Audit</span></div>
        </div>
        <div class="divider-v"></div>
        <div class="header-title">Diagnóstico de seguridad Microsoft 365</div>
      </div>
      <div class="header-right">
        <div class="tenant-badge">
          <div class="dot-live"></div>
          ${escHtml(domain)}
        </div>
        <div class="date-text">${formatDate(data.timestamp)}</div>
      </div>
    </div>`;
}

function renderScoreSection(data) {
  const el = document.getElementById('score-section');
  const pct = data.secureScore?.percentage ?? 0;
  const available = data.secureScore?.available !== false;

  const r = 28;
  const circumference = 2 * Math.PI * r;
  const targetDash = (pct / 100) * circumference;

  const scoreColor = pct >= 70 ? 'green' : pct >= 40 ? '#F59E0B' : '#F87171';
  const scoreClass = pct >= 70 ? 'green' : pct >= 40 ? '' : 'red';

  // Detect main plan from licenses
  const planName = detectPlanName(data.licenses || []);

  el.innerHTML = `
    <div class="score-bar">
      <div class="score-main">
        <div class="score-ring" id="score-ring-wrap">
          <svg width="72" height="72" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="${r}" fill="none" stroke="#1E293B" stroke-width="6"/>
            <circle id="score-arc" cx="36" cy="36" r="${r}" fill="none" stroke="${scoreColor}" stroke-width="6"
              stroke-dasharray="0 ${circumference}" stroke-linecap="round"/>
          </svg>
          <div class="score-num ${scoreClass}" id="score-num">0</div>
        </div>
        <div class="score-label">
          <p>Secure Score</p>
          <p>${available ? `${data.secureScore.currentScore} de ${data.secureScore.maxScore} posible` : 'No disponible en este plan'}</p>
        </div>
      </div>
      <div class="score-divider"></div>
      <div class="score-stats">
        <div class="score-stat"><div class="val red">${data.criticalCount ?? 0}</div><div class="lbl">Críticos</div></div>
        <div class="score-stat"><div class="val amber">${data.highCount ?? 0}</div><div class="lbl">Altos</div></div>
        <div class="score-stat"><div class="val green">${data.coveredCount ?? 0}</div><div class="lbl">Cubiertos</div></div>
        <div class="score-stat"><div class="val" style="color:white">${data.users?.length ?? 0}</div><div class="lbl">Usuarios</div></div>
      </div>
      <div class="score-right">
        <div class="plan-chip">
          <p>Plan detectado</p>
          <p>${escHtml(planName)}</p>
        </div>
      </div>
    </div>`;

  // Animate score ring
  animateScore(pct, circumference);
}

function animateScore(targetPct, circumference) {
  const arc = document.getElementById('score-arc');
  const num = document.getElementById('score-num');
  if (!arc || !num) return;

  const targetDash = (targetPct / 100) * circumference;
  let current = 0;
  const duration = 1200;
  const start = performance.now();

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3); // cubic ease out
    current = targetPct * ease;
    const dash = (current / 100) * circumference;
    arc.setAttribute('stroke-dasharray', `${dash} ${circumference - dash}`);
    num.textContent = Math.round(current);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function detectPlanName(licenses) {
  const skus = licenses.map(l => l.skuPartNumber);
  if (skus.includes('ENTERPRISEPREMIUM')) return 'Microsoft 365 E5';
  if (skus.includes('ENTERPRISEPACK'))    return 'Microsoft 365 E3';
  if (skus.includes('SPB'))               return 'Microsoft 365 Business Premium';
  if (skus.includes('O365_BUSINESS_PREMIUM'))    return 'Microsoft 365 Business Standard';
  if (skus.includes('O365_BUSINESS_ESSENTIALS')) return 'Microsoft 365 Business Basic';
  if (licenses.length > 0) return licenses[0].name || 'Plan M365 personalizado';
  return 'Sin licencias detectadas';
}

function renderMetrics(data) {
  const el = document.getElementById('metrics-row');
  const usersWithoutMFA = data.users?.filter(u => u.hasLicense && !u.hasMFA).length ?? 0;

  let devicesVal, devicesClass;
  if (!data.devices?.available) {
    devicesVal = 'N/D'; devicesClass = 'na';
  } else {
    devicesVal = data.devices.nonCompliant;
    devicesClass = devicesVal > 0 ? 'warn' : 'ok';
  }

  let caVal, caClass;
  if (!data.conditionalAccess?.available) {
    caVal = 'N/D'; caClass = 'na';
  } else {
    caVal = data.conditionalAccess.enabled;
    caClass = caVal === 0 ? 'danger' : 'ok';
  }

  const extSharing = data.externalSharing?.sitesWithExternal ?? 0;
  const extClass = extSharing > 5 ? 'danger' : extSharing > 2 ? 'warn' : 'ok';

  el.innerHTML = `
    <div class="metric-row">
      <div class="metric">
        <div class="m-val ${usersWithoutMFA > 0 ? 'danger' : 'ok'}">${usersWithoutMFA}</div>
        <div class="m-lbl">Sin MFA activo</div>
      </div>
      <div class="metric">
        <div class="m-val ${devicesClass}">${devicesVal}</div>
        <div class="m-lbl">Devices no gestionados</div>
      </div>
      <div class="metric">
        <div class="m-val ${caClass}">${caVal}</div>
        <div class="m-lbl">Políticas acceso condicional</div>
      </div>
      <div class="metric">
        <div class="m-val ${extClass}">${extSharing}</div>
        <div class="m-lbl">Permisos externos activos</div>
      </div>
    </div>`;
}

function renderRisks(data) {
  const el = document.getElementById('risks-col');
  const risks = data.risks || [];

  // Items "ok" — what they have covered
  const okItems = buildOkItems(data);

  let html = `<div class="section-label" style="margin-bottom:14px;">Riesgos detectados</div>`;

  if (risks.length === 0) {
    html += `<div class="risk-item">
      <div class="risk-icon green">${ICONS.ok.replace('stroke-width="2"', 'stroke="#059669" stroke-width="2"')}</div>
      <div class="risk-text"><strong>Sin riesgos detectados</strong><span>El tenant tiene una configuración de seguridad adecuada.</span></div>
      <div class="risk-badge ok">CORRECTO</div>
    </div>`;
  } else {
    for (const risk of risks) {
      const iconClass = levelToIconClass(risk.level);
      html += `
        <div class="risk-item">
          <div class="risk-icon ${iconClass}">${areaIcon(risk.affectedArea, iconClass)}</div>
          <div class="risk-text">
            <strong>${escHtml(risk.title)}</strong>
            <span>${escHtml(risk.description)}</span>
          </div>
          <div class="risk-badge ${risk.level}">${levelBadgeLabel(risk.level)}</div>
        </div>`;
    }
  }

  // OK items
  for (const item of okItems) {
    html += `
      <div class="risk-item">
        <div class="risk-icon green">${ICONS.ok.replace('stroke-width="2"', 'stroke="#059669" stroke-width="2"')}</div>
        <div class="risk-text"><strong>${escHtml(item.title)}</strong><span>${escHtml(item.desc)}</span></div>
        <div class="risk-badge ok">CORRECTO</div>
      </div>`;
  }

  el.innerHTML = html;
}

function buildOkItems(data) {
  const items = [];
  const skus = (data.licenses || []).map(l => l.skuPartNumber);
  const users = data.users || [];
  const total = users.filter(u => u.hasLicense).length;
  const withMFA = users.filter(u => u.hasLicense && u.hasMFA).length;

  if (withMFA > 0 && withMFA === total) {
    items.push({ title: 'MFA activo en todos los usuarios', desc: `${total} usuarios con autenticación multifactor configurada.` });
  } else if (withMFA > 0) {
    items.push({ title: `MFA activo en ${withMFA} de ${total} usuarios`, desc: 'Autenticación multifactor parcialmente desplegada.' });
  }

  if (data.conditionalAccess?.available && data.conditionalAccess.count > 0) {
    items.push({ title: `${data.conditionalAccess.count} política${data.conditionalAccess.count > 1 ? 's' : ''} de acceso condicional activa${data.conditionalAccess.count > 1 ? 's' : ''}`, desc: 'Acceso condicional configurado en el tenant.' });
  }

  const hasPremiumLicense = skus.some(s => ['SPB','ENTERPRISEPACK','ENTERPRISEPREMIUM','AAD_PREMIUM','AAD_PREMIUM_P2','EMSPREMIUM'].includes(s));
  if (hasPremiumLicense) {
    items.push({ title: 'Licencias actualizadas y asignadas', desc: `${total} usuario${total !== 1 ? 's' : ''} con licencia M365 activa.` });
  }

  if (data.backup?.hasBackup) {
    items.push({ title: 'Backup externo configurado', desc: `Proveedor detectado: ${data.backup.provider || 'solución externa'}.` });
  }

  return items;
}

function renderServices(data) {
  const skus = (data.licenses || []).map(l => l.skuPartNumber);
  const users = data.users || [];
  const total = users.filter(u => u.hasLicense).length;
  const withMFA = users.filter(u => u.hasLicense && u.hasMFA).length;

  function status(on, off, partial) {
    if (partial) return { dot: 'partial', label: 'Parcial', cls: 'status-partial' };
    if (on)      return { dot: 'on',      label: 'Activo',  cls: 'status-on' };
    if (off === false) return { dot: 'na', label: 'N/D', cls: 'status-na' };
    return { dot: 'off', label: 'No activo', cls: 'status-off' };
  }

  const mfaStatus = total === 0 ? status(false, true, false) :
    withMFA === total ? status(true, false, false) :
    withMFA > 0 ? status(false, false, true) : status(false, true, false);

  const intuneOn = data.devices?.available === true && data.devices.total > 0;
  const intuneNA = data.devices?.available === false;

  const defEOP = skus.some(s => ['ATP_ENTERPRISE','THREAT_INTELLIGENCE','SPB','ENTERPRISEPREMIUM','EMSPREMIUM'].includes(s));
  const defEOPBasic = !defEOP; // basic EOP is included in all M365
  const defEDR = skus.some(s => ['DEFENDER_ENDPOINT_P1','DEFENDER_ENDPOINT_P2','ENTERPRISEPREMIUM'].includes(s));
  const caOn = data.conditionalAccess?.available && data.conditionalAccess.count > 0;
  const caNA = !data.conditionalAccess?.available;
  const purview = skus.some(s => ['ENTERPRISEPREMIUM','EMSPREMIUM'].includes(s));
  const entraP1 = skus.some(s => ['AAD_PREMIUM','AAD_PREMIUM_P2','SPB','ENTERPRISEPACK','ENTERPRISEPREMIUM','EMSPREMIUM','EM+S'].includes(s));
  const backup = data.backup?.hasBackup;

  const services = [
    { name: 'MFA', ...mfaStatus },
    { name: 'Intune MDM', ...(intuneNA ? {dot:'na',label:'N/D',cls:'status-na'} : status(intuneOn, !intuneOn, false)) },
    { name: 'Defender EOP', ...(defEOP ? status(true,false,false) : {dot:'partial',label:'Básico',cls:'status-partial'}) },
    { name: 'Defender EDR', ...status(defEDR, !defEDR, false) },
    { name: 'Acceso condicional', ...(caNA ? {dot:'na',label:'N/D',cls:'status-na'} : status(caOn, !caOn, false)) },
    { name: 'Purview DLP', ...status(purview, !purview, false) },
    { name: 'Entra ID P1', ...status(entraP1, !entraP1, false) },
    { name: 'Backup externo', ...status(backup, !backup, false) }
  ];

  const serviceHTML = services.map(s => `
    <div class="service-item">
      <span class="service-name">${escHtml(s.name)}</span>
      <span class="service-status"><div class="dot ${s.dot}"></div><span class="${s.cls}">${s.label}</span></span>
    </div>`).join('');

  // Coverage bars
  const coverage = calculateCoverage(data);
  const barHTML = coverage.map(b => {
    const pct = b.pct;
    const fillColor = pct >= 60 ? '#10B981' : pct >= 30 ? '#F59E0B' : '#EF4444';
    const pctColor = pct >= 60 ? '#059669' : pct >= 30 ? '#D97706' : '#DC2626';
    return `
      <div class="bar-row" style="margin-top:8px;">
        <div class="bar-label"><span>${b.area}</span><span style="color:${pctColor}">${pct}%</span></div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${fillColor};"></div></div>
      </div>`;
  });
  barHTML[0] = barHTML[0].replace('margin-top:8px;', '');

  document.getElementById('services-col').innerHTML = `
    <div class="card">
      <div class="section-label" style="margin-bottom:12px;">Servicios de seguridad</div>
      <div class="service-grid">${serviceHTML}</div>
    </div>
    <div class="card">
      <div class="section-label" style="margin-bottom:10px;">Cobertura de seguridad</div>
      ${barHTML.join('')}
    </div>`;
}

function calculateCoverage(data) {
  const risks = data.risks || [];
  const areas = ['Identidad', 'Dispositivos', 'Email / Amenazas', 'Datos / Cumplimiento', 'Backup / Recuperación'];
  const riskAreas = { 'Identidad': 'Identidad', 'Dispositivos': 'Dispositivos', 'Email / Amenazas': 'Email', 'Datos / Cumplimiento': 'Datos', 'Backup / Recuperación': 'Backup' };
  const weights = { critical: 40, high: 20, medium: 10, info: 5 };

  return areas.map(displayArea => {
    const apiArea = riskAreas[displayArea];
    const areaRisks = risks.filter(r => r.affectedArea === apiArea);
    let penalty = 0;
    for (const r of areaRisks) penalty += weights[r.level] || 0;
    const pct = Math.max(0, Math.min(100, 100 - penalty));
    return { area: displayArea, pct };
  });
}

function renderUsers(data) {
  const el = document.getElementById('users-section');
  const users = (data.users || []).slice(0, 4);
  const total = data.users?.length ?? 0;
  const remaining = total - users.length;
  const remainingNoMFA = data.users?.filter((u, i) => i >= 4 && u.hasLicense && !u.hasMFA).length ?? 0;

  let html = `<div class="section-label" style="margin-bottom:12px;">Usuarios — estado de seguridad</div>`;

  users.forEach((user, i) => {
    const initials = getInitials(user.displayName);
    const color = getAvatarColor(user.displayName, i);
    const skuName = (data.licenses?.[0]?.name) || 'M365';
    const mfaTag = user.hasMFA
      ? '<span class="tag mfa-ok">MFA activo</span>'
      : '<span class="tag mfa-no">Sin MFA</span>';
    html += `
      <div class="user-row">
        <div class="user-info">
          <div class="avatar" style="background:${color}">${escHtml(initials)}</div>
          <div>
            <div class="user-name">${escHtml(user.displayName)}</div>
            <div class="user-plan">${escHtml(skuName)}</div>
          </div>
        </div>
        <div class="user-tags">${mfaTag}</div>
      </div>`;
  });

  if (remaining > 0) {
    html += `
      <div class="user-row">
        <div class="user-info">
          <div class="avatar" style="background:#92400E">+${remaining}</div>
          <div>
            <div class="user-name">${remaining} usuario${remaining > 1 ? 's' : ''} más</div>
            <div class="user-plan">${remainingNoMFA > 0 ? `${remainingNoMFA} sin MFA` : 'Todos con MFA activo'}</div>
          </div>
        </div>
        <div class="user-tags">
          ${remainingNoMFA > 0 ? `<span class="tag mfa-no">${remainingNoMFA} sin MFA</span>` : '<span class="tag mfa-ok">MFA completo</span>'}
        </div>
      </div>`;
  }

  el.innerHTML = html;
}

function renderRecommendations(data) {
  const el = document.getElementById('recommendations');
  const { primary, alternative, reasoning } = data.recommendation || {};
  if (!primary) { el.innerHTML = ''; return; }

  const tenantName = data.tenant?.displayName || 'el tenant';
  const score = data.score ?? 0;
  const criticalCount = data.criticalCount ?? 0;

  const mailtoBody = `Tenant: ${tenantName}%0ASecure Score: ${data.secureScore?.percentage ?? 0}%%0ARiesgos críticos: ${criticalCount}%0ARecomendación: ${primary.name}%0A%0AGenerado por BeAudit — BeServices`;
  const mailtoLink = `mailto:comercial@beservices.es?subject=BeAudit%20—%20Diagnóstico%20de%20seguridad%3A%20${encodeURIComponent(tenantName)}&body=${mailtoBody}`;

  function productCard(product, featured) {
    const includesHTML = product.includes.map(i => `<span class="recom-item">${escHtml(i)}</span>`).join('');
    const noteHTML = product.note ? `<div class="recom-note">⚠ ${escHtml(product.note)}</div>` : '';
    const reasoningHTML = featured && reasoning ? `<div class="recom-reasoning">${escHtml(reasoning)}</div>` : '';
    const featuredBadge = featured ? '<span class="badge-featured">RECOMENDADO</span><br>' : '';
    const nameStyle = featured ? '' : 'style="font-size:13px;"';

    return `
      <div class="recom-card ${featured ? 'featured' : 'secondary'}">
        <div class="recom-top">
          <div>
            ${featuredBadge}
            <div class="recom-name" ${nameStyle}>${escHtml(product.name)}</div>
            <div class="recom-desc">${escHtml(product.tagline)}</div>
          </div>
          <div class="price-tag">
            <div class="amount" ${featured ? '' : 'style="font-size:15px;"'}>${escHtml(product.implementationPrice)}</div>
            <div class="period">implementación · +MRR mensual</div>
          </div>
        </div>
        ${reasoningHTML}
        <div class="recom-items">${includesHTML}</div>
        ${noteHTML}
        <div class="recom-cta">
          <button class="btn-primary" onclick="openModal('${product.key}')">Ver detalle completo</button>
          ${featured ? `<a class="btn-secondary" href="${mailtoLink}">Generar propuesta</a>` : `<button class="btn-secondary" onclick="openModal('${product.key}')">Comparar opciones</button>`}
        </div>
      </div>`;
  }

  el.innerHTML = `
    <div class="recom-section">
      <div class="section-label" style="margin-bottom:12px;">Solución recomendada para este tenant</div>
      ${productCard(primary, true)}
      ${alternative ? productCard(alternative, false) : ''}
    </div>`;

  // Store products for modal
  window.__beauditData = data;
}

function renderFooter(data) {
  const el = document.getElementById('footer');
  const dateStr = formatDateShort(data?.timestamp);
  el.innerHTML = `
    <div class="footer-bar">
      <div class="footer-text">BeAudit by BeServices · Diagnóstico generado el ${dateStr} · Solo lectura · Sin acceso a contenido</div>
      <div class="footer-cta">
        <button class="footer-link" onclick="window.print()">Exportar PDF</button>
        <button class="footer-btn" onclick="window.location.href='mailto:comercial@beservices.es'">Contactar con un especialista</button>
      </div>
    </div>`;
}

// ---------- MODAL ----------

const { BESERVICES_PRODUCTS_CLIENT } = (() => {
  const products = {
    besafe_essentials: { name:'Besafe Essentials', tagline:'Protección base del entorno Microsoft 365', description:'Cubre los riesgos críticos de identidad y email. MFA, acceso condicional y protección de correo.', includes:['Configuración MFA para todos los usuarios','Políticas de acceso condicional (Entra ID P1)','Defender for Office P1 — antiphishing y antimalware','Revisión y hardening de configuración del tenant','Informe de seguridad inicial','Soporte gestionado mensual'], microsoftLicenseRequired:'Microsoft 365 Business Premium o superior (o add-on Entra ID P1)', implementationDays:13, implementationPrice:'~5.000€', mrr:'Desde 3€/usuario/mes' },
    besafe_advanced:   { name:'Besafe Advanced',   tagline:'Seguridad completa en identidades, dispositivos y datos', description:'Añade EDR en endpoints, gestión de dispositivos Intune, detección de shadow IT y protección de datos.', includes:['Todo lo de Essentials','Defender for Endpoint P1 — EDR en dispositivos','Microsoft Intune — gestión y políticas en dispositivos','Entra ID P2 — acceso condicional basado en riesgo','Detección de shadow IT y apps no autorizadas','Alertas y monitorización continua','Soporte gestionado mensual prioritario'], microsoftLicenseRequired:'Microsoft 365 Business Premium recomendado', implementationDays:19, implementationPrice:'~8.000€', mrr:'Desde 5€/usuario/mes', note:'Requiere implantación previa de Besafe Essentials' },
    besafe_plus:       { name:'Besafe Plus',       tagline:'Seguridad + backup gestionado', description:'Besafe Essentials o Advanced más BeBackup externo de Microsoft 365.', includes:['Todo lo de Besafe Essentials o Advanced','Backup externo de correo, OneDrive y SharePoint','Retención configurable (1-7 años)','Recuperación granular por archivo, buzón o sitio','Soporte ante incidencias de pérdida de datos'], microsoftLicenseRequired:'Cualquier plan M365', implementationDays:15, implementationPrice:'Desde ~6.000€', mrr:'Desde 3€/buzón/mes (backup) + seguridad' },
    besafe_total:      { name:'Besafe Total',      tagline:'Blindaje completo — el modelo Predictby', description:'Auditoría + seguridad completa + backup + disaster recovery. El bundle más completo.', includes:['Auditoría de seguridad completa con informe ejecutivo','Besafe Advanced completo','BeBackup externo (correo + OneDrive + SharePoint)','Plan de Disaster Recovery documentado','Simulacro de recuperación anual','vCIO — reuniones trimestrales de revisión estratégica'], microsoftLicenseRequired:'Microsoft 365 Business Premium recomendado', implementationDays:30, implementationPrice:'Desde ~14.000€', mrr:'Desde 8€/usuario/mes' }
  };
  return { BESERVICES_PRODUCTS_CLIENT: products };
})();

window.openModal = function(productKey) {
  const product = BESERVICES_PRODUCTS_CLIENT[productKey];
  if (!product) return;

  const includesHTML = product.includes.map(i => `<li>${escHtml(i)}</li>`).join('');
  const noteHTML = product.note ? `<div class="recom-note" style="margin-top:12px;">⚠ ${escHtml(product.note)}</div>` : '';

  document.getElementById('modal-content').innerHTML = `
    <div class="modal-product-name">${escHtml(product.name)}</div>
    <div class="modal-tagline">${escHtml(product.tagline)}</div>
    <div class="modal-desc">${escHtml(product.description)}</div>
    <div class="modal-section-title">Qué incluye</div>
    <ul class="modal-includes">${includesHTML}</ul>
    ${noteHTML}
    <div class="modal-meta">
      <div class="modal-meta-item">
        <div class="modal-meta-label">Implementación</div>
        <div class="modal-meta-value">${escHtml(product.implementationPrice)}</div>
      </div>
      <div class="modal-meta-item">
        <div class="modal-meta-label">MRR gestionado</div>
        <div class="modal-meta-value">${escHtml(product.mrr)}</div>
      </div>
      <div class="modal-meta-item">
        <div class="modal-meta-label">Días de implantación</div>
        <div class="modal-meta-value">${product.implementationDays} días hábiles</div>
      </div>
    </div>
    <div class="modal-license">
      <strong>Licencia Microsoft requerida:</strong> ${escHtml(product.microsoftLicenseRequired)}
    </div>`;

  document.getElementById('modal-overlay').style.display = 'flex';
};

function closeModal() {
  document.getElementById('modal-overlay').style.display = 'none';
}

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeModal();
});

// ---------- UTILS ----------
function escHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showLoading() {
  document.getElementById('loading').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
  document.getElementById('error').style.display = 'none';
}

function hideLoading() {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('app').style.display = 'block';
}

function showError(msg) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('app').style.display = 'none';
  document.getElementById('error').style.display = 'flex';
  document.getElementById('error-msg').textContent = msg || 'Error desconocido al conectar con Graph API.';
}

// ---------- MAIN ----------
document.addEventListener('DOMContentLoaded', async () => {
  showLoading();
  try {
    const res = await fetch('/api/summary');
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    const data = await res.json();
    hideLoading();
    renderHeader(data);
    renderScoreSection(data);
    renderMetrics(data);
    renderRisks(data);
    renderServices(data);
    renderUsers(data);
    renderRecommendations(data);
    renderFooter(data);
  } catch (e) {
    showError(e.message);
  }
});
