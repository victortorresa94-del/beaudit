'use strict';
/* ============================================================
   BeAudit — app.js  v3
   Multi-page SPA: landing → loading → app-shell (5 pages)
   + MITRE ATT&CK interactive matrix
   ============================================================ */

// ── GLOBALS ────────────────────────────────────────────────────
var _auditData      = null;
var _currentPage    = 'overview';
var _enabledProducts= {};   // productId → true/false (MITRE toggles)
var _allUsers       = [];   // for filter/search

// ── VIEWS ──────────────────────────────────────────────────────
var VIEWS = ['view-landing','view-loading','view-error','view-dashboard'];
function showView(id) {
  VIEWS.forEach(function(v){ var el=document.getElementById(v); if(el) el.style.display=(v===id)?'':'none'; });
  window.scrollTo(0,0);
}
function goToLanding(){ showView('view-landing'); }

// ── PAGE NAVIGATION ────────────────────────────────────────────
var PAGE_TITLES = { overview:'Resumen', users:'Usuarios', risks:'Hallazgos', mitre:'MITRE ATT&CK', recommendations:'Recomendaciones' };

function navigate(page) {
  _currentPage = page;
  document.querySelectorAll('.sb-item').forEach(function(el){ el.classList.toggle('active', el.getAttribute('data-page')===page); });
  document.querySelectorAll('.page-content').forEach(function(el){ el.style.display='none'; });
  var pg = document.getElementById('page-'+page);
  if(pg) pg.style.display='';
  setEl('mob-page-title', PAGE_TITLES[page]||'');
  // Lazy render MITRE on first visit
  if(page==='mitre' && _auditData) renderMitrePage(_auditData);
}

function toggleSidebar(){
  var sb = document.getElementById('sidebar');
  if(sb) sb.classList.toggle('open');
}

// ── LOADING ────────────────────────────────────────────────────
var STEPS = ['Conectando con Microsoft Graph API...','Leyendo identidades y licencias...','Analizando MFA y acceso condicional...','Evaluando dispositivos y endpoint security...','Calculando Secure Score...','Generando diagnostico de riesgos...','Preparando recomendaciones BeServices...'];
var stepTimer=null;
function startLoadingAnimation(){
  var c=document.getElementById('loading-steps'); if(!c) return;
  c.innerHTML=STEPS.map(function(s,i){ return '<div class="load-step" id="lstep-'+i+'"><span class="lstep-dot"></span><span>'+s+'</span></div>'; }).join('');
  var cur=0;
  function advance(){
    if(cur>0){ var p=document.getElementById('lstep-'+(cur-1)); if(p){p.classList.remove('active');p.classList.add('done');} }
    if(cur<STEPS.length){ var el=document.getElementById('lstep-'+cur); if(el) el.classList.add('active'); cur++; stepTimer=setTimeout(advance,600); }
  }
  advance();
}
function stopLoadingAnimation(){ if(stepTimer){clearTimeout(stepTimer);stepTimer=null;} }

// ── AUDIT ──────────────────────────────────────────────────────
async function startAudit(){
  showView('view-loading');
  startLoadingAnimation();
  try{
    var res=await fetch('/api/summary');
    var data=await res.json();
    stopLoadingAnimation();
    if(!res.ok||data.error){ showError(data.error||'Error desconocido',data.hint||''); return; }
    _auditData=data;
    _allUsers=(data.users&&data.users.list)||[];
    renderDashboard(data);
    showView('view-dashboard');
    navigate('overview');
  }catch(err){
    stopLoadingAnimation();
    showError(err.message,'Verifica que el servidor esta activo y las credenciales de Azure son correctas.');
  }
}

function showError(msg,hint){ setEl('error-msg',msg); setEl('error-hint',hint); showView('view-error'); }

// ── SCORE RING ─────────────────────────────────────────────────
function setScoreRing(score){
  var ring=document.getElementById('score-ring-fg'); if(!ring) return;
  var r=44,circ=2*Math.PI*r,pct=Math.max(0,Math.min(100,score));
  ring.setAttribute('stroke-dasharray',circ.toFixed(1));
  ring.setAttribute('stroke-dashoffset',circ.toFixed(1));
  ring.setAttribute('stroke',pct<40?'#DC2626':pct<65?'#D97706':'#059669');
  setTimeout(function(){ ring.setAttribute('stroke-dashoffset',(circ*(1-pct/100)).toFixed(1)); },120);
  setEl('score-val-num',pct);
}

// ── MAIN RENDER ────────────────────────────────────────────────
function renderDashboard(data){
  var tenant=data.tenant||{},users=data.users||{},devices=data.devices||{},security=data.security||{},risks=data.risks||{},rec=data.recommendation||{},lics=data.licenses||[],pos=data.positives||[];

  // Sidebar info
  setEl('sb-tenant-name', tenant.displayName||'—');
  setEl('sb-tenant-domain', tenant.primaryDomain||'—');
  setEl('sb-badge-users', users.withoutMfa>0?users.withoutMfa:'');
  setEl('sb-badge-risks', risks.criticalCount>0?risks.criticalCount:'');
  if(data.generatedAt){ setEl('sb-ts', new Date(data.generatedAt).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})+' · '+new Date(data.generatedAt).toLocaleDateString('es-ES',{day:'2-digit',month:'short'})); }

  // Overview subtitle
  setEl('overview-sub', 'Tenant: '+(tenant.displayName||'—')+' · '+(tenant.primaryDomain||''));

  // Score
  var score=risks.score!=null?risks.score:0;
  setScoreRing(score);
  var labels=[[80,'Riesgo Bajo'],[55,'Riesgo Moderado'],[35,'Riesgo Alto'],[0,'Riesgo Critico']];
  var lbl='Riesgo Critico'; for(var i=0;i<labels.length;i++){if(score>=labels[i][0]){lbl=labels[i][1];break;}}
  setEl('score-label',lbl);
  var n=risks.risks?risks.risks.length:0;
  setEl('score-desc','Se han detectado '+n+' hallazgo'+(n!==1?'s':'')+' de seguridad.');
  setEl('stat-critical',risks.criticalCount||0);
  setEl('stat-high',risks.highCount||0);
  setEl('stat-covered',risks.coveredCount||0);

  // KPIs
  renderKpis(data);

  // Overview sections
  renderLayers(security,users,devices);
  renderRisksOverview(risks.risks||[]);
  renderServices(security);
  renderCoverage(data);
  renderPositives(pos,'positives-grid','positives-meta');
  renderZeroTrust(data);

  // Users page
  renderUsersPage(users);

  // Risks page
  renderRisksPage(risks,pos,lics,data.secureScoreControls);

  // Recommendations page
  renderRecommendationsPage(rec,risks);

  // Init MITRE product state from real licenses
  initMitreProducts(data);
}

// ── KPI ────────────────────────────────────────────────────────
function renderKpis(data){
  var users=data.users||{},devices=data.devices||{},security=data.security||{},risks=data.risks||{};
  setEl('kpi-users-val',users.total!=null?users.total:'—');
  setBadge('kpi-users-badge',users.withoutMfa>0?users.withoutMfa+' sin MFA':'MFA OK',users.withoutMfa>0?'risk':'ok');
  var ss=security.secureScore||{},ssPct=ss.currentScore&&ss.maxScore?Math.round((ss.currentScore/ss.maxScore)*100):null;
  setEl('kpi-score-val',ssPct!=null?ssPct+'%':'—');
  if(ssPct==null) setBadge('kpi-score-badge','Sin datos','neutral');
  else if(ssPct>=70) setBadge('kpi-score-badge','Bueno','ok');
  else if(ssPct>=45) setBadge('kpi-score-badge','Mejorable','warn');
  else setBadge('kpi-score-badge','Critico','risk');
  setEl('kpi-devices-val',devices.total!=null?devices.total:0);
  if(!devices.available) setBadge('kpi-devices-badge','Sin Intune','warn');
  else setBadge('kpi-devices-badge',devices.total>0?'Gestionados':'Sin datos',devices.total>0?'ok':'neutral');
  var rArr=risks.risks||[];setEl('kpi-risks-val',rArr.length);
  var crit=risks.criticalCount||0;
  setBadge('kpi-risks-badge',crit>0?crit+' critico'+(crit>1?'s':''):'Sin criticos',crit>0?'risk':'ok');
}

// ── LAYERS ─────────────────────────────────────────────────────
function renderLayers(security,users,devices){
  var c=document.getElementById('layers-grid'); if(!c) return;
  var tot=(users&&users.total)||1,wo=(users&&users.withoutMfa)||0,mfaPct=Math.round(((tot-wo)/tot)*100);
  var LAYERS=[
    {name:'Identidad',detail:'MFA + Acceso Condicional + Entra ID',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',status:(mfaPct>=80&&security.conditionalAccess)?'ok':(mfaPct>=50||security.conditionalAccess)?'warn':'bad',statusText:mfaPct+'% MFA'+(security.conditionalAccess?'+CA':', sin CA')},
    {name:'Email',detail:'Defender for Office / anti-phishing',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',status:security.defenderOffice?'ok':'bad',statusText:security.defenderOffice?'Defender activo':'Sin proteccion'},
    {name:'Dispositivos',detail:'Intune + Defender Endpoint',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',status:(security.intune&&security.edr)?'ok':(security.intune||security.edr)?'warn':'bad',statusText:security.intune?(security.edr?'Intune+EDR':'Intune, sin EDR'):'Sin gestion'},
    {name:'Datos',detail:'Purview / DLP / clasificacion',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',status:security.purview?'ok':'bad',statusText:security.purview?'Purview activo':'Sin clasificacion'},
    {name:'Backup',detail:'Copia externa + recuperacion',icon:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',status:security.backup?'ok':'bad',statusText:security.backup?'Activo':'Sin backup'}
  ];
  c.innerHTML=LAYERS.map(function(l){ return '<div class="layer-card '+l.status+'"><div class="layer-icon">'+l.icon+'</div><div class="layer-name">'+l.name+'</div><span class="layer-status">'+l.statusText+'</span><div class="layer-detail">'+l.detail+'</div></div>'; }).join('');
}

// ── RISKS OVERVIEW (top 5 in overview page) ────────────────────
var RISK_ICONS={critical:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>',high:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',medium:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'};
var SEV_LABEL={critical:'CRITICO',high:'ALTO',medium:'MEDIO',info:'INFO'};
var BS_NAMES={besafe_essentials:'Besafe Essentials',besafe_advanced:'Besafe Advanced',besafe_plus:'Besafe Plus',besafe_total:'Besafe Total'};
var CHEVRON='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="9 18 15 12 9 6"/></svg>';

function riskItemHTML(r,clickable){
  var bsName=BS_NAMES[r.beservicesFix]||r.beservicesFix||'';
  var tags='<div class="risk-tags">'+
    (r.microsoftFix?'<span class="sol-badge ms">MS: '+escHtml(r.microsoftFix)+'</span>':'')+
    (bsName?'<span class="sol-badge bs">'+escHtml(bsName)+'</span>':'')+
  '</div>';
  var onclick=clickable?' onclick="openRiskDetail(\''+r.id+'\')"':'';
  return '<div class="risk-item'+(clickable?' clickable':'')+'"'+onclick+'>'+
    '<div class="risk-icon '+(r.severity||'info')+'">'+(RISK_ICONS[r.severity]||RISK_ICONS.info)+'</div>'+
    '<div class="risk-body"><div class="risk-title">'+escHtml(r.title)+'</div><div class="risk-desc">'+escHtml(r.description)+'</div>'+tags+'</div>'+
    '<span class="risk-badge '+(r.severity||'info')+'">'+(SEV_LABEL[r.severity]||r.severity||'')+'</span>'+
    (clickable?'<span class="risk-chevron">'+CHEVRON+'</span>':'')+
  '</div>';
}

function renderRisksOverview(risks){
  var c=document.getElementById('risk-list-overview'); if(!c) return;
  var ord={critical:0,high:1,medium:2,info:3};
  var sorted=risks.slice().sort(function(a,b){return (ord[a.severity]||9)-(ord[b.severity]||9);});
  var top=sorted.slice(0,5);
  c.innerHTML=top.map(function(r){return riskItemHTML(r,true);}).join('')+
    (risks.length>5?'<div class="risk-more-link"><button onclick="navigate(\'risks\')" class="btn-outline" style="width:100%;margin:8px 16px;width:calc(100%-32px)">Ver todos los hallazgos ('+risks.length+') &rarr;</button></div>':'');
}

// ── RISKS FULL PAGE ────────────────────────────────────────────
function renderRisksPage(risks,pos,lics,ssControls){
  var rArr=risks.risks||[];
  setEl('risks-kpi-critical',risks.criticalCount||0);
  setEl('risks-kpi-high',risks.highCount||0);
  setEl('risks-kpi-medium',rArr.filter(function(r){return r.severity==='medium';}).length);
  setEl('risks-kpi-covered',risks.coveredCount||0);
  setEl('risks-page-meta',rArr.length+' hallazgo'+(rArr.length!==1?'s':'')+' detectados');

  var c=document.getElementById('risk-list-full'); if(!c) return;
  var ord={critical:0,high:1,medium:2,info:3};
  var sorted=rArr.slice().sort(function(a,b){return (ord[a.severity]||9)-(ord[b.severity]||9);});
  c.innerHTML=sorted.length?sorted.map(function(r){return riskItemHTML(r,true);}).join(''):'<div class="empty-state"><div style="font-size:2rem">OK</div>No se han detectado riesgos. Buen trabajo.</div>';

  renderPositives(pos,'positives-grid-2','positives-meta-2');
  renderLicenses(lics);
  renderSecureScoreControls(ssControls);
}

// ── SERVICES + COVERAGE + POSITIVES ───────────────────────────
function renderServices(security){
  var c=document.getElementById('svc-grid'); if(!c||!security) return;
  var SVC=[{key:'conditionalAccess',label:'Acceso Condicional'},{key:'defenderOffice',label:'Defender for Office'},{key:'intune',label:'Microsoft Intune'},{key:'edr',label:'Defender Endpoint'},{key:'purview',label:'Microsoft Purview'},{key:'backup',label:'Backup M365'}];
  c.innerHTML=SVC.map(function(s){ var on=(security[s.key]===true||(security[s.key]&&security[s.key].enabled===true)||(Array.isArray(security[s.key])&&security[s.key].length>0)); return '<div class="svc-item"><span class="svc-dot '+(on?'on':'off')+'"></span><span class="svc-name">'+s.label+'</span><span style="margin-left:auto;font-size:.7rem;color:var(--gray-400)">'+(on?'Activo':'No detectado')+'</span></div>'; }).join('');
}

function renderCoverage(data){
  var c=document.getElementById('cov-list'); if(!c) return;
  var users=data.users||{},security=data.security||{},risks=data.risks||{};
  var tot=users.total||0,mfaPct=tot>0?Math.round(((tot-(users.withoutMfa||0))/tot)*100):0;
  var ss=security.secureScore||{},ssPct=ss.currentScore&&ss.maxScore?Math.round((ss.currentScore/ss.maxScore)*100):0;
  var rn=risks.risks?risks.risks.length:0,cov=rn>0?Math.round(((rn-(risks.criticalCount||0))/rn)*100):100;
  var BARS=[{label:'Cobertura MFA',pct:mfaPct,cls:mfaPct>=80?'good':mfaPct>=50?'warn':'bad'},{label:'Secure Score',pct:ssPct,cls:ssPct>=70?'good':ssPct>=45?'warn':'bad'},{label:'Riesgos cubiertos',pct:cov,cls:cov>=80?'good':cov>=50?'warn':'bad'}];
  c.innerHTML=BARS.map(function(b){ return '<div class="cov-row"><div class="cov-header"><span class="cov-label">'+b.label+'</span><span class="cov-pct">'+b.pct+'%</span></div><div class="bar-track"><div class="bar-fill '+b.cls+'" style="width:0%" data-target="'+b.pct+'"></div></div></div>'; }).join('');
  requestAnimationFrame(function(){ c.querySelectorAll('.bar-fill').forEach(function(el){el.style.width=el.getAttribute('data-target')+'%';}); });
}

var POS_ICONS={shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',lock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>',device:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',chart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',save:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',mail:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',cpu:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/></svg>',check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'};

function renderPositives(pos,gridId,metaId){
  var grid=document.getElementById(gridId); if(!grid) return;
  var meta=document.getElementById(metaId);
  if(!pos||!pos.length){ grid.innerHTML='<div class="empty-state">No se han detectado controles de seguridad activos.</div>'; return; }
  if(meta) meta.textContent=pos.length+' control'+(pos.length!==1?'es':'')+' activo'+(pos.length!==1?'s':'');
  grid.innerHTML=pos.map(function(p){ var icon=POS_ICONS[p.icon]||POS_ICONS.check; return '<div class="positive-item"><div class="pos-icon">'+icon+'</div><div class="pos-body"><div class="pos-title">'+escHtml(p.title)+'</div><div class="pos-detail">'+escHtml(p.detail)+'</div></div></div>'; }).join('');
}

function renderLicenses(lics){
  var c=document.getElementById('lic-list'),meta=document.getElementById('lic-meta'); if(!c) return;
  var active=lics.filter(function(l){return l.consumedUnits>0;});
  if(meta) meta.textContent=active.length+' licencia'+(active.length!==1?'s':'')+' activa'+(active.length!==1?'s':'')+' de '+lics.length+' total';
  c.innerHTML=active.map(function(l){ return '<div class="lic-row"><span class="lic-dot"></span><span class="lic-name">'+escHtml(l.name||l.skuPartNumber)+'</span><span class="lic-count">'+l.consumedUnits+' / '+l.enabledUnits+' uds.</span></div>'; }).join('');
}

// ── USERS PAGE ─────────────────────────────────────────────────
function renderUsersPage(users){
  var total=users.total||0,withoutMfa=users.withoutMfa||0,withMfa=users.withMfa||(total-withoutMfa);
  var mfaPct=total>0?Math.round((withMfa/total)*100):0,noMfaPct=total>0?Math.round((withoutMfa/total)*100):0;
  setEl('users-kpi-total',total);
  setEl('users-kpi-nomfa',withoutMfa);
  setEl('users-kpi-nomfa-pct',noMfaPct+'%');
  setEl('users-kpi-mfa',withMfa);
  setEl('users-kpi-mfa-pct',mfaPct+'%');
  renderUsersTable(_allUsers,'');
}

function filterUsers(q){
  var filter=document.getElementById('user-filter');
  var fval=filter?filter.value:'all';
  var list=_allUsers;
  if(fval==='nomfa') list=list.filter(function(u){return !u.hasMfa;});
  if(fval==='mfa')   list=list.filter(function(u){return u.hasMfa;});
  if(q&&q.length>1){ var ql=q.toLowerCase(); list=list.filter(function(u){ return (u.displayName||'').toLowerCase().includes(ql)||(u.userPrincipalName||'').toLowerCase().includes(ql); }); }
  renderUsersTable(list,q);
}

function renderUsersTable(list,q){
  var c=document.getElementById('users-full-list'); if(!c) return;
  var showing=document.getElementById('users-showing');
  if(showing) showing.textContent='('+list.length+' usuario'+(list.length!==1?'s':'')+')';

  // Sort: sin MFA primero
  var sorted=list.slice().sort(function(a,b){
    if(a.hasMfa===b.hasMfa) return (a.displayName||'').localeCompare(b.displayName||'');
    return a.hasMfa?1:-1;
  });

  if(!sorted.length){ c.innerHTML='<div class="empty-state">No se encontraron usuarios.</div>'; return; }

  c.innerHTML='<table class="users-table"><thead><tr><th>Usuario</th><th>Email</th><th>Estado MFA</th><th>Licencia</th></tr></thead><tbody>'+
    sorted.map(function(u){
      var noMfa=!u.hasMfa;
      return '<tr'+(noMfa?' class="row-nomfa"':'')+'>'+
        '<td><span class="dt-avatar" style="background:'+(noMfa?'var(--critical)':'var(--navy)')+'">'+getInitials(u.displayName||'?')+'</span> <span class="dt-name">'+escHtml(u.displayName||'—')+'</span></td>'+
        '<td class="dt-email">'+escHtml(u.userPrincipalName||'—')+'</td>'+
        '<td><span class="dt-badge '+(noMfa?'bad':'ok')+'">'+(noMfa?'Sin MFA':'MFA activo')+'</span></td>'+
        '<td><span style="font-size:.72rem;color:var(--gray-400)">'+(u.hasLicense?'Con licencia':'Sin licencia')+'</span></td>'+
      '</tr>';
    }).join('')+
  '</tbody></table>';
}

// ── RECOMMENDATIONS PAGE ───────────────────────────────────────
var PRODUCT_DATA={
  besafe_essentials:{name:'Besafe Essentials',price:'desde 15 EUR/usuario/mes',desc:'Proteccion base para Microsoft 365. Ideal para empresas con riesgos bajos y buenas practicas implementadas.',features:['Gestion MFA y acceso condicional','Monitorizacion basica de seguridad','Soporte L1/L2 BeServices','Informes mensuales de estado']},
  besafe_advanced:{name:'Besafe Advanced',price:'desde 25 EUR/usuario/mes',desc:'Seguridad avanzada para organizaciones con multiples riesgos criticos.',features:['Todo lo de Essentials','Defender for Office 365 P2','Microsoft Intune MDM/MAM','SOC 24/7','Respuesta a incidentes']},
  besafe_plus:{name:'Besafe Plus',price:'desde 35 EUR/usuario/mes',desc:'Continuidad de negocio y cumplimiento normativo con backup incluido.',features:['Todo lo de Advanced','Backup M365 (Exchange, Teams, SharePoint)','Microsoft Purview Compliance','Retencion y eDiscovery']},
  besafe_total:{name:'Besafe Total',price:'desde 45 EUR/usuario/mes',desc:'Maxima proteccion para entornos con riesgo critico. Cobertura end-to-end.',features:['Todo lo de Plus','Defender for Endpoint P2 + EDR','Defender for Identity','Microsoft Sentinel SIEM','CISO virtual BeServices']}
};
var PRODUCT_ORDER=['besafe_essentials','besafe_advanced','besafe_plus','besafe_total'];

function renderRecommendationsPage(rec,risks){
  var banner=document.getElementById('rec-reasoning-banner');
  if(banner&&rec.reasoning){ banner.style.display=''; banner.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg> '+escHtml(rec.reasoning); }

  var c=document.getElementById('recom-grid'); if(!c) return;
  var primary=rec.product||'besafe_total',pidx=PRODUCT_ORDER.indexOf(primary);
  var secondary=pidx<PRODUCT_ORDER.length-1?PRODUCT_ORDER[pidx+1]:PRODUCT_ORDER[pidx-1];

  c.innerHTML=[primary,secondary].filter(Boolean).map(function(pid){
    var p=PRODUCT_DATA[pid]; if(!p) return '';
    var isPrimary=pid===primary;
    return '<div class="recom-card'+(isPrimary?' primary':'')+'">'+
      '<div class="recom-badge-wrap"><span class="recom-badge'+(isPrimary?' recommended':'')+'">'+( isPrimary?'Recomendado':'Tambien disponible')+'</span></div>'+
      '<div class="recom-body"><div class="recom-name">'+escHtml(p.name)+'</div><div class="recom-price">'+escHtml(p.price)+'</div><div class="recom-desc">'+escHtml(p.desc)+'</div>'+
      '<ul class="recom-features">'+p.features.map(function(f){return '<li>'+escHtml(f)+'</li>';}).join('')+'</ul></div>'+
      '<div class="recom-footer">'+( isPrimary?'<button class="btn-primary-sm" onclick="openContactModal(\''+pid+'\')">Solicitar propuesta</button>':'<button class="btn-outline" onclick="openContactModal(\''+pid+'\')">Ver detalles</button>')+'</div></div>';
  }).join('');

  // Comparison table
  renderPlanComparison(risks);
}

function renderPlanComparison(risks){
  var c=document.getElementById('plan-comparison-table'); if(!c) return;
  var FEATURES=[
    {name:'MFA gestionado',ess:true,adv:true,plus:true,total:true},
    {name:'Acceso Condicional (Entra ID P1)',ess:true,adv:true,plus:true,total:true},
    {name:'Defender for Office 365 P1',ess:true,adv:true,plus:true,total:true},
    {name:'Defender for Office 365 P2',ess:false,adv:true,plus:true,total:true},
    {name:'Microsoft Intune MDM/MAM',ess:false,adv:true,plus:true,total:true},
    {name:'Defender for Endpoint P1',ess:false,adv:true,plus:true,total:true},
    {name:'Defender for Endpoint P2 + EDR',ess:false,adv:false,plus:false,total:true},
    {name:'Backup externo M365',ess:false,adv:false,plus:true,total:true},
    {name:'Microsoft Purview / DLP',ess:false,adv:false,plus:true,total:true},
    {name:'Defender for Identity',ess:false,adv:false,plus:false,total:true},
    {name:'Microsoft Sentinel SIEM',ess:false,adv:false,plus:false,total:true},
    {name:'CISO virtual BeServices',ess:false,adv:false,plus:false,total:true},
    {name:'SOC 24/7',ess:false,adv:true,plus:true,total:true},
    {name:'Soporte gestionado',ess:true,adv:true,plus:true,total:true}
  ];
  var check='<svg viewBox="0 0 24 24" fill="none" stroke="var(--ok)" stroke-width="3" width="15" height="15"><polyline points="20 6 9 17 4 12"/></svg>';
  var cross='<svg viewBox="0 0 24 24" fill="none" stroke="var(--gray-300)" stroke-width="2" width="15" height="15"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  c.innerHTML='<table class="cmp-table">'+
    '<thead><tr><th>Caracteristica</th><th>Essentials</th><th>Advanced</th><th>Plus</th><th>Total</th></tr></thead>'+
    '<tbody>'+FEATURES.map(function(f){
      return '<tr><td>'+escHtml(f.name)+'</td><td>'+(f.ess?check:cross)+'</td><td>'+(f.adv?check:cross)+'</td><td>'+(f.plus?check:cross)+'</td><td>'+(f.total?check:cross)+'</td></tr>';
    }).join('')+'</tbody>'+
    '<tfoot><tr><td><strong>Precio orientativo</strong></td><td>15 EUR/usr</td><td>25 EUR/usr</td><td>35 EUR/usr</td><td>45 EUR/usr</td></tr></tfoot>'+
  '</table>';
}

// ============================================================
//   MITRE ATT&CK
// ============================================================

var MITRE_TACTICS=[
  {id:'initial-access',    name:'Acceso Inicial',          icon:'🚪'},
  {id:'persistence',       name:'Persistencia',            icon:'🔗'},
  {id:'privilege-esc',     name:'Escal. Privilegios',      icon:'⬆️'},
  {id:'defense-evasion',   name:'Evasion Defensa',         icon:'🕵️'},
  {id:'credential-access', name:'Acceso Credenciales',     icon:'🔑'},
  {id:'discovery',         name:'Descubrimiento',          icon:'🔍'},
  {id:'lateral-movement',  name:'Mov. Lateral',            icon:'↔️'},
  {id:'collection',        name:'Recoleccion',             icon:'📦'},
  {id:'exfiltration',      name:'Exfiltracion',            icon:'📤'},
  {id:'impact',            name:'Impacto',                 icon:'💥'}
];

var MITRE_TECHNIQUES=[
  // Initial Access
  {id:'T1566.001',tactic:'initial-access',name:'Phishing: Adjunto malicioso',desc:'Email con adjunto que ejecuta malware o macro',covers:['defender-office-p1','defender-office-p2','defender-endpoint-p1']},
  {id:'T1566.002',tactic:'initial-access',name:'Phishing: Enlace malicioso',desc:'Email con link a pagina falsa de credenciales (AiTM)',covers:['defender-office-p1','defender-office-p2','entra-p2']},
  {id:'T1566.003',tactic:'initial-access',name:'Phishing via Teams/Servicios',desc:'Phishing enviado a traves de Teams, SharePoint o apps SaaS',covers:['defender-office-p2','defender-cloud-apps']},
  {id:'T1078',    tactic:'initial-access',name:'Cuentas Validas robadas',desc:'Uso de credenciales comprometidas para acceder al tenant',covers:['entra-p1','entra-p2']},
  {id:'T1110.003',tactic:'initial-access',name:'Password Spraying',desc:'Una contrasena debil probada contra todos los usuarios',covers:['entra-p1','entra-p2','sentinel']},
  {id:'T1199',    tactic:'initial-access',name:'Relacion de Confianza (vendor)',desc:'Compromiso de un proveedor tercero con acceso al tenant',covers:['entra-p2','defender-cloud-apps','sentinel']},
  {id:'T1534',    tactic:'initial-access',name:'Spearphishing interno',desc:'Email malicioso enviado desde cuenta interna comprometida',covers:['defender-office-p1','defender-office-p2']},
  // Persistence
  {id:'T1098.001',tactic:'persistence',name:'Credenciales cloud adicionales',desc:'Agregar credenciales del atacante a Service Principals de Entra',covers:['entra-p2','defender-identity','sentinel']},
  {id:'T1098.002',tactic:'persistence',name:'Permisos delegado de correo',desc:'Dar al atacante acceso delegado al buzon de la victima',covers:['defender-office-p1','defender-office-p2','sentinel']},
  {id:'T1098.003',tactic:'persistence',name:'Reglas de reenvio de correo',desc:'Reenvio automatico de todos los emails a cuenta externa',covers:['defender-office-p1','defender-office-p2']},
  {id:'T1136.003',tactic:'persistence',name:'Crear cuenta cloud nueva',desc:'Crear cuenta Entra ID, app o service principal backdoor',covers:['entra-p2','defender-identity','sentinel']},
  {id:'T1078.004',tactic:'persistence',name:'Cuentas cloud (persistencia)',desc:'Usar cuentas cloud legitimas para mantener acceso',covers:['entra-p1','entra-p2','defender-cloud-apps']},
  // Privilege Escalation
  {id:'T1548',    tactic:'privilege-esc',name:'Abuso control de elevacion',desc:'Escalar privilegios en el tenant abusando de roles Entra',covers:['entra-p2','sentinel']},
  {id:'T1078.002',tactic:'privilege-esc',name:'Cuenta de administrador',desc:'Comprometer o abusar de cuentas admin de Azure AD/Entra',covers:['entra-p2','defender-identity']},
  // Defense Evasion
  {id:'T1562',    tactic:'defense-evasion',name:'Deshabilitar defensas',desc:'Desactivar politicas de auditoria, DLP o alertas de seguridad',covers:['defender-endpoint-p2','sentinel','purview']},
  {id:'T1550.001',tactic:'defense-evasion',name:'Token de aplicacion OAuth',desc:'Usar token robado sin necesitar MFA (post-phishing)',covers:['entra-p2','defender-cloud-apps','sentinel']},
  {id:'T1550.004',tactic:'defense-evasion',name:'Cookie de sesion robada',desc:'Session hijacking post-autenticacion (bypass de MFA)',covers:['entra-p2','defender-office-p2']},
  // Credential Access
  {id:'T1539',    tactic:'credential-access',name:'Robo de cookie de sesion',desc:'AiTM: robar sesion autenticada para acceder sin MFA',covers:['entra-p2','defender-cloud-apps']},
  {id:'T1528',    tactic:'credential-access',name:'Robo de token OAuth',desc:'Extraer tokens de acceso de aplicaciones OAuth consentidas',covers:['entra-p2','defender-cloud-apps','sentinel']},
  {id:'T1621',    tactic:'credential-access',name:'Fatiga de MFA (bombardeo)',desc:'Enviar notificaciones MFA masivas hasta que el usuario acepta',covers:['entra-p2']},
  {id:'T1110.001',tactic:'credential-access',name:'Fuerza bruta contrasena',desc:'Intentos masivos de contrasenas contra cuentas cloud',covers:['entra-p1','entra-p2']},
  {id:'T1187',    tactic:'credential-access',name:'Autenticacion forzada',desc:'Forzar al cliente a autenticarse capturando hashes NTLM',covers:['defender-identity','sentinel']},
  // Discovery
  {id:'T1087.004',tactic:'discovery',name:'Descubrimiento de cuentas cloud',desc:'Enumerar todos los usuarios, grupos y roles de Entra ID',covers:['defender-identity','defender-cloud-apps','sentinel']},
  {id:'T1526',    tactic:'discovery',name:'Descubrimiento servicios cloud',desc:'Mapear recursos, aplicaciones y APIs disponibles en M365',covers:['defender-cloud-apps','sentinel']},
  {id:'T1538',    tactic:'discovery',name:'Acceso a dashboard de gestion',desc:'Acceder al portal de Azure/M365 para extraer configuracion',covers:['entra-p2','sentinel','defender-cloud-apps']},
  // Lateral Movement
  {id:'T1021.007',tactic:'lateral-movement',name:'Servicios cloud remotos',desc:'Usar credenciales validas para acceder a otros servicios M365',covers:['sentinel','defender-identity','entra-p2']},
  {id:'T1550',    tactic:'lateral-movement',name:'Material de autenticacion alterno',desc:'Reutilizar tokens o tickets para pivotar a otros usuarios/apps',covers:['entra-p1','entra-p2','defender-cloud-apps']},
  // Collection
  {id:'T1114.002',tactic:'collection',name:'Recoleccion de email remota',desc:'Acceso masivo a buzones de Exchange Online via IMAP/OAuth',covers:['defender-office-p1','defender-office-p2','sentinel']},
  {id:'T1114.003',tactic:'collection',name:'Regla de reenvio de correo',desc:'Exfiltrar todo el correo mediante reglas de reenvio automatico',covers:['defender-office-p1','defender-office-p2']},
  {id:'T1213.002',tactic:'collection',name:'Datos de SharePoint/OneDrive',desc:'Descargar documentos masivamente de SharePoint y OneDrive',covers:['defender-office-p2','purview','defender-cloud-apps']},
  {id:'T1119',    tactic:'collection',name:'Recoleccion automatizada',desc:'Scripts que recopilan y agregan datos del tenant en masa',covers:['sentinel','defender-cloud-apps']},
  // Exfiltration
  {id:'T1537',    tactic:'exfiltration',name:'Transferencia a cuenta cloud',desc:'Copiar datos a cuenta controlada por el atacante (OneDrive, GDrive)',covers:['purview','sentinel','defender-cloud-apps']},
  {id:'T1567.002',tactic:'exfiltration',name:'Exfiltracion a servicio web',desc:'Subir datos a Dropbox, WeTransfer u otros servicios externos',covers:['purview','defender-cloud-apps','defender-endpoint-p1']},
  {id:'T1020',    tactic:'exfiltration',name:'Exfiltracion automatizada',desc:'Proceso background que exfiltra datos de forma continua',covers:['sentinel','purview']},
  // Impact
  {id:'T1486',    tactic:'impact',name:'Ransomware (cifrado de datos)',desc:'Cifrar archivos de OneDrive, SharePoint y equipos corporativos',covers:['backup','defender-endpoint-p2','defender-office-p1']},
  {id:'T1485',    tactic:'impact',name:'Destruccion de datos',desc:'Borrado masivo de correos, archivos y datos del tenant',covers:['backup','purview']},
  {id:'T1489',    tactic:'impact',name:'Interrupcion de servicio',desc:'Deshabilitar licencias, politicas o servicios criticos del tenant',covers:['defender-endpoint-p2','sentinel']}
];

var SECURITY_PRODUCTS=[
  {id:'entra-p1',          name:'Entra ID P1',             group:'Identidad',   desc:'Acceso Condicional, MFA por politica, SSPR',           besafe:['essentials','advanced','plus','total']},
  {id:'entra-p2',          name:'Entra ID P2',             group:'Identidad',   desc:'PIM, Identity Protection, CA basada en riesgo',        besafe:['advanced','plus','total']},
  {id:'defender-office-p1',name:'Defender for Office P1',  group:'Email',       desc:'Safe Attachments, Safe Links, Anti-phishing avanzado', besafe:['essentials','advanced','plus','total']},
  {id:'defender-office-p2',name:'Defender for Office P2',  group:'Email',       desc:'Threat Explorer, Attack Simulation Training',          besafe:['advanced','plus','total']},
  {id:'intune',            name:'Microsoft Intune',         group:'Dispositivos',desc:'MDM/MAM, politicas de cumplimiento de dispositivos',  besafe:['advanced','plus','total']},
  {id:'defender-endpoint-p1',name:'Defender Endpoint P1',  group:'Dispositivos',desc:'Antivirus NG, reduccion de superficie de ataque',      besafe:['advanced','plus','total']},
  {id:'defender-endpoint-p2',name:'Defender Endpoint P2',  group:'Dispositivos',desc:'EDR completo, Threat & Vulnerability Management',      besafe:['total']},
  {id:'purview',           name:'Microsoft Purview',        group:'Datos',       desc:'DLP, clasificacion, eDiscovery, retencion',            besafe:['plus','total']},
  {id:'defender-identity', name:'Defender for Identity',   group:'Avanzado',    desc:'Deteccion amenazas en AD/Entra, movimiento lateral',   besafe:['total']},
  {id:'defender-cloud-apps',name:'Defender Cloud Apps',    group:'Avanzado',    desc:'CASB, shadow IT, control de apps SaaS',                besafe:['total']},
  {id:'sentinel',          name:'Microsoft Sentinel',       group:'Avanzado',    desc:'SIEM cloud nativo, SOAR, threat hunting',              besafe:['total']},
  {id:'backup',            name:'Backup Externo M365',      group:'Backup',      desc:'Copia correo, OneDrive, SharePoint, Teams',            besafe:['plus','total']}
];

var BESAFE_PRODUCTS={
  essentials: ['entra-p1','defender-office-p1'],
  advanced:   ['entra-p1','entra-p2','defender-office-p1','defender-office-p2','intune','defender-endpoint-p1'],
  plus:       ['entra-p1','entra-p2','defender-office-p1','defender-office-p2','intune','defender-endpoint-p1','purview','backup'],
  total:      ['entra-p1','entra-p2','defender-office-p1','defender-office-p2','intune','defender-endpoint-p1','defender-endpoint-p2','purview','defender-identity','defender-cloud-apps','sentinel','backup']
};

// Detect which products are active from real license data
function initMitreProducts(data){
  var lics=(data.licenses||[]).map(function(l){return l.skuPartNumber;});
  var sec=data.security||{};
  _enabledProducts={};
  SECURITY_PRODUCTS.forEach(function(p){
    var on=false;
    switch(p.id){
      case 'entra-p1':           on=lics.some(function(l){return ['AAD_PREMIUM','AAD_PREMIUM_P2','SPB','ENTERPRISEPACK','ENTERPRISEPREMIUM','EM+S','EMSPREMIUM'].includes(l);}); break;
      case 'entra-p2':           on=lics.some(function(l){return ['AAD_PREMIUM_P2','ENTERPRISEPREMIUM','EMSPREMIUM'].includes(l);}); break;
      case 'defender-office-p1': on=sec.defenderOffice||lics.some(function(l){return ['ATP_ENTERPRISE','THREAT_INTELLIGENCE','SPB','ENTERPRISEPREMIUM','EMSPREMIUM'].includes(l);}); break;
      case 'defender-office-p2': on=lics.some(function(l){return ['THREAT_INTELLIGENCE','ENTERPRISEPREMIUM','EMSPREMIUM'].includes(l);}); break;
      case 'intune':             on=sec.intune||lics.some(function(l){return ['INTUNE_A','SPB','ENTERPRISEPACK','ENTERPRISEPREMIUM','EM+S','EMSPREMIUM'].includes(l);}); break;
      case 'defender-endpoint-p1':on=lics.some(function(l){return ['DEFENDER_ENDPOINT_P1','DEFENDER_ENDPOINT_P2','SPB','ENTERPRISEPREMIUM'].includes(l);}); break;
      case 'defender-endpoint-p2':on=sec.edr||lics.some(function(l){return ['DEFENDER_ENDPOINT_P2','ENTERPRISEPREMIUM'].includes(l);}); break;
      case 'purview':            on=sec.purview||lics.some(function(l){return ['ENTERPRISEPREMIUM','EMSPREMIUM'].includes(l);}); break;
      case 'defender-identity':  on=false; break; // rarely auto-detectable
      case 'defender-cloud-apps':on=false; break;
      case 'sentinel':           on=false; break;
      case 'backup':             on=sec.backup||false; break;
    }
    _enabledProducts[p.id]=!!on;
  });
}

function renderMitrePage(data){
  renderMitreProducts();
  updateMitreMatrix();
}

function renderMitreProducts(){
  var c=document.getElementById('mitre-products'); if(!c) return;
  var groups={};
  SECURITY_PRODUCTS.forEach(function(p){ if(!groups[p.group]) groups[p.group]=[]; groups[p.group].push(p); });
  // Render as horizontal chips with group separators
  c.innerHTML=Object.keys(groups).map(function(g){
    var chips=groups[g].map(function(p){
      var on=!!_enabledProducts[p.id];
      return '<label class="mp-chip'+(on?' active':'')+'" title="'+escHtml(p.desc)+'">'+
        '<input type="checkbox" '+(on?'checked':'')+' onchange="toggleProduct(\''+p.id+'\',this.checked)">'+
        escHtml(p.name)+
      '</label>';
    }).join('');
    return '<span class="mp-group-sep">'+escHtml(g)+'</span>'+chips;
  }).join('');;
}

function toggleProduct(id,val){
  _enabledProducts[id]=val;
  updateMitreMatrix();
}

function simPlan(plan,ev){
  document.querySelectorAll('.mitre-plan-btn').forEach(function(b){ b.classList.remove('active'); });
  if(ev&&ev.target) ev.target.classList.add('active');
  if(plan==='current'){ initMitreProducts(_auditData); }
  else{
    SECURITY_PRODUCTS.forEach(function(p){ _enabledProducts[p.id]=false; });
    var prods=BESAFE_PRODUCTS[plan]||[];
    prods.forEach(function(pid){ _enabledProducts[pid]=true; });
  }
  renderMitreProducts();
  updateMitreMatrix();
}

function updateMitreMatrix(){
  // Coverage stats
  var covered=0,exposed=0;
  MITRE_TECHNIQUES.forEach(function(t){
    var isCovered=t.covers.some(function(pid){return !!_enabledProducts[pid];});
    if(isCovered) covered++; else exposed++;
  });
  var total=MITRE_TECHNIQUES.length;
  setEl('ms-covered',covered);
  setEl('ms-exposed',exposed);
  setEl('ms-pct',Math.round((covered/total)*100)+'%');

  // Render matrix
  var c=document.getElementById('mitre-matrix'); if(!c) return;
  c.innerHTML=MITRE_TACTICS.map(function(tactic){
    var techs=MITRE_TECHNIQUES.filter(function(t){return t.tactic===tactic.id;});
    var tacticCovered=techs.filter(function(t){return t.covers.some(function(pid){return !!_enabledProducts[pid];});}).length;
    return '<div class="mitre-col">'+
      '<div class="mitre-tactic-hdr">'+
        '<span class="mitre-tactic-icon">'+tactic.icon+'</span>'+
        '<span class="mitre-tactic-name">'+tactic.name+'</span>'+
        '<span class="mitre-tactic-count">'+tacticCovered+'/'+techs.length+'</span>'+
      '</div>'+
      '<div class="mitre-techs">'+
        techs.map(function(t){
          var isCovered=t.covers.some(function(pid){return !!_enabledProducts[pid];});
          var coveringProds=t.covers.filter(function(pid){return !!_enabledProducts[pid];});
          var shortNames=coveringProds.slice(0,2).map(function(pid){ var p=SECURITY_PRODUCTS.find(function(sp){return sp.id===pid;}); return p?p.name.replace('Microsoft ','').replace('Defender for ','Def. ').replace(' for Office','').replace(' Endpoint','').replace(' Identity',''):pid; });
          return '<div class="mitre-tech '+(isCovered?'covered':'exposed')+'" onclick="openTechDetail(\''+t.id+'\')">'+
            '<div class="mt-id">'+t.id+'</div>'+
            '<div class="mt-name">'+escHtml(t.name)+'</div>'+
            '<div class="mt-indicator">'+(isCovered?
              '✓ '+shortNames.join(', ')+(coveringProds.length>2?' +':''):
              '⚠ Expuesto')+
            '</div>'+
          '</div>';
        }).join('')+
      '</div>'+
    '</div>';
  }).join('');
}

// ── TECHNIQUE DETAIL DRAWER ────────────────────────────────────
function openTechDetail(techId){
  var t=MITRE_TECHNIQUES.find(function(x){return x.id===techId;}); if(!t) return;
  var tactic=MITRE_TACTICS.find(function(x){return x.id===t.tactic;})||{name:t.tactic,icon:'🔒'};
  var isCovered=t.covers.some(function(pid){return !!_enabledProducts[pid];});
  var cls=isCovered?'covered':'exposed';

  // Build product rows
  var productRows=SECURITY_PRODUCTS.filter(function(p){return t.covers.includes(p.id);}).map(function(p){
    var active=!!_enabledProducts[p.id];
    var rowCls=active?'covers':(t.covers.includes(p.id)?'missing-active':'missing');
    var statusTxt=active?'Activo':'No activo';
    return '<div class="mtd-product-row '+rowCls+'">'+
      '<span class="mtd-product-icon">'+(active?'✓':'○')+'</span>'+
      '<span class="mtd-product-name">'+escHtml(p.name)+'</span>'+
      '<span class="mtd-product-status">'+statusTxt+'</span>'+
    '</div>';
  }).join('');

  // Products NOT in covers that would complement (empty if all covered)
  var allCoversActive=t.covers.every(function(pid){return !!_enabledProducts[pid];});
  var mitreUrl='https://attack.mitre.org/techniques/'+t.id.replace('.','/')+'/';

  var html='<div class="mtd-header '+cls+'">'+
    '<div style="flex:1;min-width:0">'+
      '<div class="mtd-id">'+t.id+'</div>'+
      '<div class="mtd-title">'+escHtml(t.name)+'</div>'+
      '<div class="mtd-badges">'+
        '<span class="mtd-badge '+cls+'">'+(isCovered?'✓ Cubierto':'⚠ Expuesto')+'</span>'+
        '<span class="mtd-badge tactic">'+tactic.icon+' '+tactic.name+'</span>'+
      '</div>'+
    '</div>'+
    '<button class="mtd-close" onclick="closeTechDetail()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>'+
  '</div>'+
  '<div class="mtd-body">'+
    '<div class="mtd-section">'+
      '<div class="mtd-section-title">Descripcion del ataque</div>'+
      '<div class="mtd-desc">'+escHtml(t.desc)+'</div>'+
    '</div>'+
    '<div class="mtd-section">'+
      '<div class="mtd-section-title">Productos que cubren esta tecnica</div>'+
      (productRows||'<div style="font-size:.825rem;color:var(--gray-400)">Ningun producto de los disponibles cubre esta tecnica.</div>')+
    '</div>'+
    (isCovered?'':'<div class="mtd-section" style="background:rgba(220,38,38,.02)"><div class="mtd-section-title" style="color:var(--critical)">Para cubrir este riesgo necesitas</div>'+
      t.covers.map(function(pid){var p=SECURITY_PRODUCTS.find(function(x){return x.id===pid;});if(!p)return '';
        var plan=p.besafe&&p.besafe[0]?p.besafe[0]:'—';
        return '<div class="mtd-product-row missing-active"><span class="mtd-product-icon">📦</span><span class="mtd-product-name">'+escHtml(p.name)+'</span><span class="mtd-product-status">Besafe '+plan.charAt(0).toUpperCase()+plan.slice(1)+'</span></div>';
      }).join('')+
    '</div>')+
  '</div>'+
  '<div class="mtd-footer">'+
    '<a href="'+mitreUrl+'" target="_blank" rel="noopener" class="btn-primary-sm" style="text-decoration:none;display:inline-flex">Ver en MITRE ATT&CK &rarr;</a>'+
    '<button class="btn-outline" onclick="closeTechDetail()">Cerrar</button>'+
  '</div>';

  var content=document.getElementById('mtd-content'); if(content) content.innerHTML=html;
  var drawer=document.getElementById('mitre-tech-detail'); if(drawer) drawer.classList.add('open');
  document.body.style.overflow='hidden';
}

function closeTechDetail(){
  var d=document.getElementById('mitre-tech-detail'); if(d) d.classList.remove('open');
  document.body.style.overflow='';
}

// ── DRAWER ─────────────────────────────────────────────────────
function openRiskDetail(riskId){
  if(!_auditData) return;
  var risks=(_auditData.risks&&_auditData.risks.risks)||[];
  var risk=null; for(var i=0;i<risks.length;i++){if(risks[i].id===riskId){risk=risks[i];break;}} if(!risk) return;
  var content=document.getElementById('drawer-content'); if(!content) return;
  content.innerHTML=buildDrawerHTML(risk,_auditData);
  var drawer=document.getElementById('detail-drawer'); if(drawer) drawer.classList.add('open');
  document.body.style.overflow='hidden';
}
function closeDrawer(){ var d=document.getElementById('detail-drawer'); if(d) d.classList.remove('open'); document.body.style.overflow=''; }

function buildDrawerHTML(risk,data){
  var sev=risk.severity||'info',sevLabel=SEV_LABEL[sev]||sev.toUpperCase();
  var sevColour={critical:'#DC2626',high:'#D97706',medium:'#CA8A04',info:'#0075F2'}[sev]||'#0075F2';
  var bsName=BS_NAMES[risk.beservicesFix]||risk.beservicesFix||'';
  var header='<div class="drawer-header"><div class="drawer-header-icon">'+(RISK_ICONS[sev]||RISK_ICONS.info)+'</div><div class="drawer-header-text"><h3>'+escHtml(risk.title)+'</h3><p>Area: '+escHtml(risk.affectedArea||'—')+'</p></div><span class="drawer-sev-pill" style="background:'+sevColour+'">'+sevLabel+'</span><button class="drawer-close" onclick="closeDrawer()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div>';
  var descSection='<div class="drawer-section"><div class="drawer-section-title">Descripcion del riesgo</div><div class="drawer-desc">'+escHtml(risk.description)+'</div></div>';
  var dataSection=buildRiskDataSection(risk,data);
  var fixSection='<div class="drawer-section"><div class="drawer-section-title">Como resolver este riesgo</div>'+
    (risk.microsoftFix?'<div class="fix-card"><div class="fix-icon ms"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg></div><div class="fix-body"><div class="fix-label">Solucion Microsoft</div><div class="fix-name">'+escHtml(risk.microsoftFix)+'</div><div class="fix-desc">Licencia o configuracion necesaria para cubrir este riesgo.</div></div></div>':'')+
    (bsName?'<div class="fix-card"><div class="fix-icon bs"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div><div class="fix-body"><div class="fix-label">Plan BeServices que incluye esto</div><div class="fix-name">'+escHtml(bsName)+'</div><div class="fix-desc">BeServices implanta y gestiona esta capa de seguridad de forma continua.</div></div></div>':'')+
  '</div>';
  var footer='<div class="drawer-footer"><a href="https://beservices.es/contacto" target="_blank" rel="noopener" class="btn-primary-sm" style="text-decoration:none;display:inline-flex">Solicitar solucion</a><button class="btn-outline" onclick="closeDrawer()">Cerrar</button></div>';
  return '<div class="drawer-body">'+header+descSection+dataSection+fixSection+'</div>'+footer;
}

function buildRiskDataSection(risk,data){
  var users=data.users||{},devices=data.devices||{},security=data.security||{};
  switch(risk.id){
    case 'mfa_disabled':{
      var all=users.list||[],tot=users.total||all.length,wm=users.withMfa||(tot-(users.withoutMfa||0)),wom=users.withoutMfa||(tot-wm),pct=tot>0?Math.round((wm/tot)*100):0;
      var sorted=all.slice().sort(function(a,b){if(a.hasMfa===b.hasMfa)return(a.displayName||'').localeCompare(b.displayName||'');return a.hasMfa?1:-1;});
      return '<div class="drawer-section"><div class="drawer-stats"><div class="drawer-stat bad"><div class="drawer-stat-val">'+wom+'</div><div class="drawer-stat-lbl">Sin MFA</div></div><div class="drawer-stat ok"><div class="drawer-stat-val">'+wm+'</div><div class="drawer-stat-lbl">Con MFA</div></div><div class="drawer-stat '+(pct>=80?'ok':pct>=50?'warn':'bad')+'"><div class="drawer-stat-val">'+pct+'%</div><div class="drawer-stat-lbl">Cobertura</div></div></div></div>'+
        '<div class="drawer-section"><div class="drawer-section-title" style="display:flex;justify-content:space-between"><span>Todos los usuarios con licencia ('+tot+')</span><span style="color:var(--critical);font-weight:400">'+wom+' sin MFA arriba</span></div>'+
        '<table class="detail-table"><thead><tr><th>Usuario</th><th>Estado MFA</th></tr></thead><tbody>'+
        sorted.map(function(u){var noMfa=!u.hasMfa;return '<tr'+(noMfa?' style="background:rgba(220,38,38,.03)"':'')+'>'+
          '<td><span class="dt-avatar" style="background:'+(noMfa?'var(--critical)':'var(--navy)')+'">'+getInitials(u.displayName||'?')+'</span><span class="dt-name">'+escHtml(u.displayName||'—')+'</span><br><span class="dt-email">'+escHtml(u.userPrincipalName||'')+'</span></td>'+
          '<td><span class="dt-badge '+(noMfa?'bad':'ok')+'">'+(noMfa?'Sin MFA':'MFA activo')+'</span></td></tr>';}).join('')+
        '</tbody></table></div>';
    }
    case 'no_conditional_access':{
      var cc=security.caCount||0,ce=security.caEnabled||0;
      return '<div class="drawer-section"><div class="drawer-stats"><div class="drawer-stat bad"><div class="drawer-stat-val">'+cc+'</div><div class="drawer-stat-lbl">Politicas totales</div></div><div class="drawer-stat bad"><div class="drawer-stat-val">'+ce+'</div><div class="drawer-stat-lbl">Activas</div></div></div></div>'+
        '<div class="drawer-section"><div class="drawer-section-title">Que significa</div><div style="font-size:.875rem;color:var(--gray-600);line-height:1.7"><p style="margin-bottom:10px">Sin politicas de Acceso Condicional, cualquier usuario con credenciales validas puede acceder desde <strong>cualquier dispositivo, ubicacion o red</strong> sin restricciones adicionales.</p><p>El Acceso Condicional permite: bloquear paises de riesgo, requerir dispositivo gestionado, forzar MFA en apps criticas, bloquear acceso legacy.</p></div></div>';
    }
    case 'no_intune':{
      var dt=devices.total||0,dc=devices.compliant||0,dnc=devices.nonCompliant||0;
      var dl=(devices.nonCompliantList||devices.list||[]).slice(0,20);
      return '<div class="drawer-section"><div class="drawer-stats"><div class="drawer-stat"><div class="drawer-stat-val">'+dt+'</div><div class="drawer-stat-lbl">Total</div></div><div class="drawer-stat ok"><div class="drawer-stat-val">'+dc+'</div><div class="drawer-stat-lbl">Conformes</div></div><div class="drawer-stat warn"><div class="drawer-stat-val">'+dnc+'</div><div class="drawer-stat-lbl">No conformes</div></div></div></div>'+
        (dl.length?'<div class="drawer-section"><div class="drawer-section-title">Dispositivos detectados</div><table class="detail-table"><thead><tr><th>Nombre</th><th>OS</th><th>Estado</th></tr></thead><tbody>'+
        dl.map(function(d){var cls=d.complianceState==='compliant'?'ok':'warn';return '<tr><td class="dt-name">'+escHtml(d.name||'—')+'</td><td>'+escHtml(d.os||'—')+'</td><td><span class="dt-badge '+cls+'">'+escHtml(d.complianceState||'—')+'</span></td></tr>';}).join('')+'</tbody></table></div>':'');
    }
    case 'no_backup':{
      var tu=users.total||0;
      return '<div class="drawer-section"><div class="drawer-section-title">Datos en riesgo</div><div style="font-size:.875rem;color:var(--gray-600);line-height:1.7;margin-bottom:16px"><p>Microsoft <strong>no realiza copias de seguridad</strong> de tus datos. En caso de ransomware, borrado accidental o sabotaje, la recuperacion puede ser imposible.</p></div><div class="drawer-stats"><div class="drawer-stat"><div class="drawer-stat-val">'+tu+'</div><div class="drawer-stat-lbl">Buzones de correo</div></div><div class="drawer-stat"><div class="drawer-stat-val">'+tu+'</div><div class="drawer-stat-lbl">OneDrives</div></div><div class="drawer-stat bad"><div class="drawer-stat-val">0</div><div class="drawer-stat-lbl">Backups activos</div></div></div></div>';
    }
    case 'low_secure_score':{
      var ss2=security.secureScore||{},pct2=ss2.percentage||0;
      return '<div class="drawer-section"><div class="drawer-stats"><div class="drawer-stat bad"><div class="drawer-stat-val">'+pct2+'%</div><div class="drawer-stat-lbl">Tu puntuacion</div></div><div class="drawer-stat"><div class="drawer-stat-val">'+(ss2.currentScore||0)+'</div><div class="drawer-stat-lbl">Puntos actuales</div></div><div class="drawer-stat"><div class="drawer-stat-val">'+(ss2.maxScore||0)+'</div><div class="drawer-stat-lbl">Puntos maximos</div></div></div></div>'+
        '<div class="drawer-section"><div class="drawer-section-title">Que evalua</div><div style="font-size:.875rem;color:var(--gray-600);line-height:1.7">Microsoft analiza cientos de configuraciones de seguridad. Una puntuacion baja indica multiples controles sin configurar que aumentan la superficie de ataque.</div></div>';
    }
    case 'too_many_global_admins':{
      var ss3=data.securitySettings||{},roles=ss3.adminRoles||[];
      var gRole=roles.find(function(r){return r.name==='Global Administrator';})||{memberCount:0,members:[]};
      var content='<div class="drawer-section"><div class="drawer-stats"><div class="drawer-stat bad"><div class="drawer-stat-val">'+gRole.memberCount+'</div><div class="drawer-stat-lbl">Global Admins</div></div><div class="drawer-stat warn"><div class="drawer-stat-val">3</div><div class="drawer-stat-lbl">Recomendado max</div></div></div></div>';
      if(roles.length){
        content+='<div class="drawer-section"><div class="drawer-section-title">Roles privilegiados detectados</div>'+
          '<table class="detail-table"><thead><tr><th>Rol</th><th>Miembros</th></tr></thead><tbody>'+
          roles.map(function(r){ return '<tr><td class="dt-name">'+escHtml(r.name)+'</td><td>'+r.memberCount+'</td></tr>'; }).join('')+
          '</tbody></table></div>';
      }
      if(gRole.members&&gRole.members.length){
        content+='<div class="drawer-section"><div class="drawer-section-title">Administradores globales</div>'+
          '<table class="detail-table"><thead><tr><th>Usuario</th><th>Email</th></tr></thead><tbody>'+
          gRole.members.map(function(m){return '<tr><td class="dt-name">'+escHtml(m.name||'—')+'</td><td class="dt-email">'+escHtml(m.email||'—')+'</td></tr>';}).join('')+
          '</tbody></table></div>';
      }
      return content;
    }
    case 'guest_access_open':{
      var ss4=data.securitySettings||{};
      var policyMap={'none':'Solo administradores (optimo)','adminsAndGuestInviters':'Admins + rol Guest Inviter','adminsGuestInvitersAndAllMembers':'Admins + rol Inviter + TODOS los miembros','everyone':'Cualquier usuario incluyendo invitados'};
      var pol=ss4.guestInvitePolicy||'desconocida';
      return '<div class="drawer-section"><div class="drawer-section-title">Configuracion actual</div>'+
        '<table class="detail-table"><tbody>'+
        '<tr><td>Politica de invitacion de invitados</td><td><span class="dt-badge warn">'+escHtml(policyMap[pol]||pol)+'</span></td></tr>'+
        '<tr><td>Rol de invitado restringido</td><td><span class="dt-badge '+(ss4.guestRoleRestricted?'ok':'bad')+'">'+(ss4.guestRoleRestricted?'Si (seguro)':'No (arriesgado)')+'</span></td></tr>'+
        '</tbody></table></div>'+
        '<div class="drawer-section"><div class="drawer-section-title">Que significa</div><div style="font-size:.875rem;color:var(--gray-600);line-height:1.7">Con esta politica, usuarios del tenant pueden invitar cuentas externas a Microsoft Teams y SharePoint sin supervision de TI, creando riesgo de fuga de datos o acceso no autorizado.</div></div>';
    }
    case 'no_security_defaults':{
      var ss5=data.securitySettings||{};
      return '<div class="drawer-section"><div class="drawer-section-title">Estado de la proteccion base</div>'+
        '<table class="detail-table"><tbody>'+
        '<tr><td>Security Defaults de Microsoft</td><td><span class="dt-badge '+(ss5.securityDefaultsEnabled?'ok':'bad')+'">'+(ss5.securityDefaultsEnabled?'Activos':'Desactivados')+'</span></td></tr>'+
        '<tr><td>Acceso Condicional configurado</td><td><span class="dt-badge '+(data.security&&data.security.conditionalAccess?'ok':'bad')+'">'+(data.security&&data.security.conditionalAccess?'Si':'No')+'</span></td></tr>'+
        '</tbody></table></div>'+
        '<div class="drawer-section"><div class="drawer-section-title">Que bloquean los Security Defaults</div><div style="font-size:.875rem;color:var(--gray-600);line-height:1.7"><p style="margin-bottom:8px">Los Security Defaults son la linea de defensa minima de Microsoft. Sin ellos ni CA, los atacantes pueden usar <strong>autenticacion heredada (SMTP, POP3, IMAP)</strong> que <strong>no soporta MFA</strong>, haciendo inutil cualquier politica de segundo factor.</p><p>Afecta a: ataques de password spray, credential stuffing y acceso desde apps antiguas de Outlook.</p></div></div>';
    }
    default: return '<div class="drawer-section"><div class="drawer-desc">'+escHtml(risk.description)+'</div></div>';
  }
}

// ── ZERO TRUST ASSESSMENT ──────────────────────────────────────
function renderZeroTrust(data){
  var c=document.getElementById('zt-pillars'); if(!c) return;
  var sec=data.security||{},users=data.users||{},devices=data.devices||{};
  var tot=users.total||1,mfaPct=Math.round(((tot-(users.withoutMfa||0))/tot)*100);
  var ss=sec.secureScore||{};

  // Score each pillar 0-100
  var PILLARS=[
    {
      id:'identity', name:'Identidad', icon:'👤',
      desc:'MFA, Acceso Condicional, Entra ID, roles privilegiados',
      score: (function(){
        var pts=0;
        if(mfaPct>=80)pts+=35; else if(mfaPct>=50)pts+=15;
        if(sec.conditionalAccess)pts+=30;
        if(sec.entraP1)pts+=20;
        var ss2=data.securitySettings||{};
        if(ss2.securityDefaultsEnabled||sec.conditionalAccess)pts+=15;
        return Math.min(100,pts);
      })()
    },
    {
      id:'devices', name:'Dispositivos', icon:'💻',
      desc:'Intune MDM, cumplimiento, EDR en endpoints',
      score: (function(){
        var pts=0;
        if(sec.intune)pts+=40; if(sec.edr)pts+=40;
        if(devices.available&&devices.total>0){
          var cPct=Math.round((devices.compliant/Math.max(devices.total,1))*100);
          pts+=Math.round(cPct*0.2);
        }
        return Math.min(100,pts);
      })()
    },
    {
      id:'apps', name:'Aplicaciones', icon:'📱',
      desc:'Defender for Office, Safe Links, anti-phishing, CASB',
      score: (function(){
        var pts=0;
        if(sec.defenderOffice)pts+=60;
        if(sec.conditionalAccess)pts+=25;
        if(sec.purview)pts+=15;
        return Math.min(100,pts);
      })()
    },
    {
      id:'data', name:'Datos', icon:'📄',
      desc:'Purview DLP, clasificacion, backup externo',
      score: (function(){
        var pts=0;
        if(sec.purview)pts+=45;
        if(sec.backup)pts+=40;
        var ext=data.security&&data.security.externalSharing;
        if(!ext||!ext.sitesWithExternal||ext.sitesWithExternal===0)pts+=15;
        return Math.min(100,pts);
      })()
    },
    {
      id:'infra', name:'Infraestructura', icon:'🏗️',
      desc:'Secure Score, roles admin, auditoria, SIEM',
      score: (function(){
        var pts=0;
        var ssPct=ss.percentage||0;
        pts+=Math.round(ssPct*0.5);
        var ss2=data.securitySettings||{};
        if(ss2.globalAdminCount>0&&ss2.globalAdminCount<=3)pts+=25;
        else if(ss2.globalAdminCount===0)pts+=10;
        if(ss2.guestRoleRestricted)pts+=25;
        return Math.min(100,pts);
      })()
    },
    {
      id:'network', name:'Red', icon:'🌐',
      desc:'Acceso Condicional por ubicacion, segmentacion, VPN',
      score: (function(){
        var pts=0;
        if(sec.conditionalAccess)pts+=60; // CA covers network conditions
        if(sec.entraP1)pts+=20;
        if(sec.intune)pts+=20; // compliance-based network access
        return Math.min(100,pts);
      })()
    }
  ];

  var overall=Math.round(PILLARS.reduce(function(s,p){return s+p.score;},0)/PILLARS.length);

  c.innerHTML='<div class="zt-overall"><div class="zt-overall-val">'+overall+'<span>%</span></div><div class="zt-overall-lbl">Madurez Zero Trust global</div></div>'+
  '<div class="zt-grid">'+
  PILLARS.map(function(p){
    var cls=p.score>=70?'good':p.score>=40?'warn':'bad';
    return '<div class="zt-pillar"><div class="zt-pillar-icon">'+p.icon+'</div>'+
      '<div class="zt-pillar-name">'+p.name+'</div>'+
      '<div class="zt-pillar-score '+(p.score>=70?'ok':p.score>=40?'warn':'bad')+'">'+p.score+'%</div>'+
      '<div class="bar-track" style="margin-top:6px"><div class="bar-fill '+cls+'" style="width:0%" data-target="'+p.score+'"></div></div>'+
      '<div class="zt-pillar-desc">'+p.desc+'</div>'+
    '</div>';
  }).join('')+
  '</div>';
  requestAnimationFrame(function(){c.querySelectorAll('.bar-fill').forEach(function(el){el.style.width=el.getAttribute('data-target')+'%';});});
}

// ── SECURE SCORE CONTROLS ──────────────────────────────────────
var COST_ICONS={low:'⚡',moderate:'🔧',high:'🏗️'};
function renderSecureScoreControls(ssControls){
  var panel=document.getElementById('ss-controls-panel'); if(!panel) return;
  if(!ssControls||!ssControls.available||!ssControls.controls||!ssControls.controls.length){ panel.style.display='none'; return; }
  panel.style.display='';
  var top=ssControls.controls.slice(0,15); // top 15 by improvement potential
  setEl('ss-controls-meta','Top '+top.length+' acciones — '+ssControls.controls.reduce(function(s,c){return s+(c.maxScore-c.score);},0).toFixed(0)+' puntos de mejora posibles');
  var c=document.getElementById('ss-controls-list'); if(!c) return;
  c.innerHTML=top.map(function(ctrl){
    var gained=ctrl.score,gain=ctrl.maxScore-ctrl.score;
    var pct=ctrl.maxScore>0?Math.round((gained/ctrl.maxScore)*100):0;
    var cls=pct>=80?'ok':pct>=40?'warn':'bad';
    var costIcon=COST_ICONS[ctrl.implementationCost]||'🔧';
    return '<div class="ss-ctrl-row">'+
      '<div class="ss-ctrl-main">'+
        '<div class="ss-ctrl-title">'+escHtml(ctrl.title)+'</div>'+
        '<div class="ss-ctrl-meta"><span class="ss-ctrl-cat">'+escHtml(ctrl.category)+'</span>'+
          (ctrl.implementationCost?'<span class="ss-ctrl-cost" title="Coste de implementacion: '+ctrl.implementationCost+'">'+costIcon+' '+ctrl.implementationCost+'</span>':'')+
          (ctrl.userImpact&&ctrl.userImpact!=='none'?'<span class="ss-ctrl-impact">👤 '+ctrl.userImpact+' impacto en usuario</span>':'')+
        '</div>'+
        (ctrl.remediation?'<div class="ss-ctrl-desc">'+escHtml(ctrl.remediation.substring(0,180))+(ctrl.remediation.length>180?'…':'')+'</div>':'')+
      '</div>'+
      '<div class="ss-ctrl-score">'+
        '<div class="ss-ctrl-pts '+(gain>0?'gain':'done')+'">'+
          (gain>0?'+'+gain.toFixed(0)+' pts':gained.toFixed(0)+'/'+ctrl.maxScore.toFixed(0)+'pts')+
        '</div>'+
        '<div class="bar-track" style="width:80px;margin-top:4px"><div class="bar-fill '+cls+'" style="width:0%" data-target="'+pct+'"></div></div>'+
      '</div>'+
    '</div>';
  }).join('');
  requestAnimationFrame(function(){c.querySelectorAll('.bar-fill').forEach(function(el){el.style.width=el.getAttribute('data-target')+'%';});});
}

// ── CONTACT MODAL ──────────────────────────────────────────────
function openContactModal(pid){
  var p=PRODUCT_DATA[pid]; if(!p) return;
  var body=document.getElementById('modal-body'); if(!body) return;
  var chk='<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>';
  var cls='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  body.innerHTML='<div class="modal-header"><button class="modal-x" onclick="closeModal()">'+cls+'</button><h3>'+escHtml(p.name)+'</h3><p style="font-size:.875rem;color:var(--gray-500);margin-top:4px">'+escHtml(p.price)+'</p></div>'+
    '<div class="modal-body-content"><div class="modal-section"><h4>Que incluye</h4><div class="modal-feature-list">'+p.features.map(function(f){return '<div class="modal-feature-item"><span class="modal-feature-icon">'+chk+'</span>'+escHtml(f)+'</div>';}).join('')+'</div></div>'+
    '<div class="modal-section"><p style="font-size:.875rem;color:var(--gray-500);line-height:1.7">'+escHtml(p.desc)+'</p></div></div>'+
    '<div class="modal-footer"><a href="https://beservices.es/contacto" target="_blank" rel="noopener" class="btn-primary-sm" style="text-decoration:none;display:inline-flex">Hablar con un especialista</a><button class="btn-outline" onclick="closeModal()" style="margin-left:10px">Cerrar</button></div>';
  var ov=document.getElementById('modal-overlay'); if(ov) ov.style.display='flex';
}
function closeModal(){ var ov=document.getElementById('modal-overlay'); if(ov) ov.style.display='none'; }

// ── HELPERS ────────────────────────────────────────────────────
function setEl(id,val){ var el=document.getElementById(id); if(el) el.textContent=val!=null?val:'—'; }
function setBadge(id,text,cls){ var el=document.getElementById(id); if(el){el.textContent=text;el.className='kpi-badge '+(cls||'neutral');} }
function getInitials(name){ return String(name).split(/\s+/).slice(0,2).map(function(w){return w[0]||'';}).join('').toUpperCase()||'?'; }
function escHtml(str){ if(!str) return ''; return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ── INIT ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded',function(){
  showView('view-landing');
  var ov=document.getElementById('modal-overlay'); if(ov) ov.addEventListener('click',function(e){if(e.target===ov)closeModal();});
  document.addEventListener('keydown',function(e){ if(e.key==='Escape'){closeDrawer();closeModal();} });
  window.startAudit=startAudit; window.goToLanding=goToLanding; window.navigate=navigate;
  window.toggleSidebar=toggleSidebar; window.openRiskDetail=openRiskDetail; window.closeDrawer=closeDrawer;
  window.openContactModal=openContactModal; window.closeModal=closeModal;
  window.filterUsers=filterUsers; window.toggleProduct=toggleProduct; window.simPlan=simPlan;
  window.openTechDetail=openTechDetail; window.closeTechDetail=closeTechDetail;
});
