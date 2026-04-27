'use strict';
require('dotenv').config({ override: true });
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const { getSummary } = require('./graph');
const { calculateRisks } = require('./scoring');
const { getRecommendation } = require('./recommendations');

// ── BEE AI SECURITY ADVISOR ────────────────────────────────────────────────
const BEE_SYSTEM_PROMPT = `Eres Bee, el asistente de seguridad de BeServices. Eres un experto en ciberseguridad para empresas de 10-200 empleados que trabajan con Microsoft 365 o Google Workspace.

CONTEXTO DE ESTA CONVERSACIÓN:
El usuario acaba de ver el diagnóstico de seguridad de su tenant de Microsoft 365 generado por BeAudit. Conoces sus datos reales:
- Tenant: {{tenant_name}} ({{tenant_domain}})
- Secure Score: {{secure_score}}/100 — {{score_label}}
- Riesgos críticos: {{critical_count}}
- Riesgos altos: {{high_count}}
- Usuarios sin MFA: {{users_without_mfa}} de {{total_users}}
- Plan Microsoft detectado: {{ms_plan}}
- Hallazgos principales: {{top_risks}}
- Recomendación generada: {{recommended_product}}

Usa estos datos cuando el usuario pregunte sobre su situación concreta.

QUIÉN ERES:
- Trabajas para BeServices, MSP en Barcelona
- Llevas años auditando tenants de M365 y Google Workspace
- Hablas en español, tono directo y cercano, sin ser informal en exceso
- Máximo 3 párrafos por respuesta. Sé conciso y ve al grano.
- Usa listas cortas cuando ayuden a la claridad, no por defecto

PRODUCTOS QUE PUEDES RECOMENDAR:
Besafe Essentials (~5.000 EUR implementación + MRR) → Riesgos críticos de identidad y email → MFA gestionado, acceso condicional (Entra ID P1), Defender for Office P1, hardening del tenant → Tiempo: ~13 días laborables
Besafe Advanced (~8.000 EUR implementación + MRR) → Múltiples riesgos críticos + dispositivos expuestos → Todo Essentials + EDR endpoints, Intune MDM, Entra ID P2, detección shadow IT → Requiere Essentials previo (o implementación conjunta) → Tiempo: ~19 días laborables
Besafe Plus (desde ~6.000 EUR + MRR) → Empresas sin backup externo de M365 → Essentials o Advanced + BeBackup (correo, OneDrive, SharePoint, Teams)
Besafe Total (desde ~14.000 EUR + MRR) → Blindaje completo con entregable ejecutivo → Auditoría + Advanced + BeBackup + Disaster Recovery + reunión vCIO trimestral
BeBackup standalone (desde 3 EUR/buzón/mes) → Solo backup M365 sin capa de seguridad adicional
BeHelp (soporte gestionado) → BeHelp Month: soporte mensual recurrente → BeHelp Pack: bolsa de horas (15/30/60/120h anuales) → BeHelp On Demand: por incidencia

NOVEDADES MICROSOFT QUE CONOCES:
- Microsoft sube precios en julio 2026
- Microsoft 365 E7 disponible mayo 2026 (~99 USD/usuario): E5 + Copilot + agentes autónomos
- Defender Suite y Purview Suite como add-ons Business Premium desde sept 2025 (~10 EUR/usuario/mes cada uno)
- NIS2 y EU AI Act en vigor — empresas deben documentar su postura de seguridad

REGLAS:
- Empieza desde los datos reales del tenant si son relevantes
- Precios Microsoft: di siempre "orientativo, confirmar con contrato"
- Si algo escapa a tu conocimiento técnico exacto, di: "Eso te lo confirma nuestro equipo técnico. ¿Te paso el contacto?"
- Nunca presiones para contratar. Informa, explica el riesgo.
- Termina con una pregunta, acción concreta o CTA suave:
  → "¿Quieres que te explique cómo se implementaría en vuestro caso?"
  → "¿Te genero un resumen para compartir con tu dirección?"
  → "¿Hablamos con un especialista esta semana?"

LO QUE NO HACES:
- No inventas datos del tenant que no tienes
- No das precios cerrados de Microsoft (son orientativos)
- No prometes fechas sin que el equipo técnico confirme
- No recomiendas productos de competidores
- No hablas de temas fuera de seguridad IT y productividad digital`;

function buildBeeSystemPrompt(tenantContext) {
  const {
    tenantName, tenantDomain, secureScore, scoreLabel,
    criticalCount, highCount, usersWithoutMfa, totalUsers,
    msPlan, topRisks, recommendedProduct
  } = tenantContext;
  return BEE_SYSTEM_PROMPT
    .replace('{{tenant_name}}',        tenantName        || 'desconocido')
    .replace('{{tenant_domain}}',      tenantDomain      || '')
    .replace('{{secure_score}}',       secureScore       || '?')
    .replace('{{score_label}}',        scoreLabel        || 'Riesgo Alto')
    .replace('{{critical_count}}',     criticalCount     || 0)
    .replace('{{high_count}}',         highCount         || 0)
    .replace('{{users_without_mfa}}',  usersWithoutMfa   || 0)
    .replace('{{total_users}}',        totalUsers        || 0)
    .replace('{{ms_plan}}',            msPlan            || 'no detectado')
    .replace('{{top_risks}}',          topRisks          || 'ver dashboard')
    .replace('{{recommended_product}}',recommendedProduct|| 'Besafe Advanced');
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve frontend from /client
app.use(express.static(path.join(__dirname, '..', 'client')));

// Rate limit: max 10 requests per minute on the heavy endpoint
const summaryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Demasiadas peticiones. Espera un momento antes de volver a cargar.' }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/summary', summaryLimiter, async (req, res) => {
  try {
    const summary = await getSummary();
    // Pass securitySettings into risk check data
    summary.securitySettings = summary.securitySettings || {};
    const { score, risks, criticalCount, highCount, coveredCount } = calculateRisks(summary);
    const recommendation = getRecommendation(risks, summary.users.length);

    // ── Users ──────────────────────────────────────────────────────────────
    const userList = Array.isArray(summary.users) ? summary.users : [];
    const withoutMfa = userList.filter(u => !u.hasMFA).length;

    const normalisedUsers = userList.map(u => ({
      id:                u.id,
      displayName:       u.displayName,
      userPrincipalName: u.email,
      hasMfa:            u.hasMFA,
      hasLicense:        u.hasLicense,
      licenseSkus:       u.licenseSkus || []
    }));

    // ── Risks: rename level → severity ─────────────────────────────────────
    const normalisedRisks = risks.map(r => ({
      ...r,
      severity: r.level
    }));

    // ── Services from licenses ─────────────────────────────────────────────
    const lics = Array.isArray(summary.licenses) ? summary.licenses : [];
    const licSkus = lics.map(l => l.skuPartNumber);
    const hasDefenderOffice = licSkus.some(p => ['ATP_ENTERPRISE','THREAT_INTELLIGENCE','SPB','ENTERPRISEPREMIUM','EMSPREMIUM'].includes(p));
    const hasEdr             = licSkus.some(p => ['DEFENDER_ENDPOINT_P1','DEFENDER_ENDPOINT_P2','ENTERPRISEPREMIUM'].includes(p));
    const hasPurview         = licSkus.some(p => ['ENTERPRISEPREMIUM','EMSPREMIUM'].includes(p));
    const hasIntuneP1        = licSkus.some(p => ['INTUNE_A','SPB','ENTERPRISEPACK','ENTERPRISEPREMIUM','EM+S','EMSPREMIUM'].includes(p));
    const hasEntraP1         = licSkus.some(p => ['AAD_PREMIUM','AAD_PREMIUM_P2','SPB','ENTERPRISEPREMIUM','EM+S','EMSPREMIUM'].includes(p));

    // ── Devices ───────────────────────────────────────────────────────────
    const devicesList = summary.devices?.devices || [];
    const nonCompliantDevices = devicesList.filter(d => d.complianceState !== 'compliant');
    const compliantDevices    = devicesList.filter(d => d.complianceState === 'compliant');

    // ── Positives ─────────────────────────────────────────────────────────
    const positives = [];

    // MFA coverage
    const withMfaCount = userList.length - withoutMfa;
    if (withMfaCount > 0) {
      positives.push({
        id: 'mfa_ok',
        icon: 'shield',
        title: withMfaCount + ' usuario' + (withMfaCount > 1 ? 's' : '') + ' con MFA activo',
        detail: Math.round((withMfaCount / Math.max(userList.length, 1)) * 100) + '% de cobertura de autenticacion multifactor'
      });
    }

    // Conditional Access
    const caEnabled = summary.conditionalAccess?.enabled || 0;
    const caTotal   = summary.conditionalAccess?.count   || 0;
    if (summary.conditionalAccess?.available && caEnabled > 0) {
      positives.push({
        id: 'ca_ok',
        icon: 'lock',
        title: caEnabled + ' politica' + (caEnabled > 1 ? 's' : '') + ' de Acceso Condicional activa' + (caEnabled > 1 ? 's' : ''),
        detail: caTotal + ' politica' + (caTotal > 1 ? 's' : '') + ' en total en Entra ID'
      });
    }

    // Intune compliant devices
    if (summary.devices?.available && summary.devices.compliant > 0) {
      positives.push({
        id: 'intune_ok',
        icon: 'device',
        title: summary.devices.compliant + ' dispositivo' + (summary.devices.compliant > 1 ? 's' : '') + ' gestionado' + (summary.devices.compliant > 1 ? 's' : '') + ' por Intune',
        detail: 'Con politicas de cumplimiento verificadas por Microsoft'
      });
    }

    // Secure Score
    if (summary.secureScore?.available && summary.secureScore.percentage >= 50) {
      positives.push({
        id: 'score_ok',
        icon: 'chart',
        title: 'Secure Score: ' + summary.secureScore.percentage + '% de cumplimiento',
        detail: summary.secureScore.currentScore + ' / ' + summary.secureScore.maxScore + ' puntos segun Microsoft'
      });
    }

    // Backup
    if (summary.backup?.hasBackup) {
      positives.push({
        id: 'backup_ok',
        icon: 'save',
        title: 'Backup externo activo' + (summary.backup.provider ? ': ' + summary.backup.provider : ''),
        detail: 'Proteccion frente a perdida de datos y ransomware'
      });
    }

    // Defender for Office
    if (hasDefenderOffice) {
      positives.push({
        id: 'defender_office_ok',
        icon: 'mail',
        title: 'Defender for Office activo',
        detail: 'Proteccion anti-phishing y anti-malware en el correo'
      });
    }

    // EDR
    if (hasEdr) {
      positives.push({
        id: 'edr_ok',
        icon: 'cpu',
        title: 'Defender for Endpoint (EDR) activo',
        detail: 'Deteccion y respuesta a amenazas en endpoints'
      });
    }

    // Premium licenses
    const PREMIUM_SKUS = ['SPB','ENTERPRISEPACK','ENTERPRISEPREMIUM','AAD_PREMIUM','AAD_PREMIUM_P2','INTUNE_A','ATP_ENTERPRISE','THREAT_INTELLIGENCE','DEFENDER_ENDPOINT_P1','DEFENDER_ENDPOINT_P2','EM+S','EMSPREMIUM'];
    lics.filter(l => PREMIUM_SKUS.includes(l.skuPartNumber) && l.consumedUnits > 0).forEach(l => {
      positives.push({
        id: 'lic_' + l.skuPartNumber,
        icon: 'check',
        title: l.name || l.skuPartNumber,
        detail: l.consumedUnits + ' licencia' + (l.consumedUnits > 1 ? 's' : '') + ' activa' + (l.consumedUnits > 1 ? 's' : '') + ' / ' + l.enabledUnits + ' habilitada' + (l.enabledUnits > 1 ? 's' : '')
      });
    });

    // ── Final response ─────────────────────────────────────────────────────
    res.json({
      generatedAt: summary.timestamp,
      tenant: summary.tenant,

      users: {
        total:      userList.length,
        withoutMfa: withoutMfa,
        withMfa:    withMfaCount,
        list:       normalisedUsers
      },

      devices: {
        available:         summary.devices?.available ?? false,
        total:             summary.devices?.total      ?? 0,
        compliant:         summary.devices?.compliant  ?? 0,
        nonCompliant:      summary.devices?.nonCompliant ?? 0,
        list:              devicesList,
        nonCompliantList:  nonCompliantDevices,
        compliantList:     compliantDevices
      },

      security: {
        secureScore:       summary.secureScore,
        conditionalAccess: summary.conditionalAccess?.enabled > 0,
        caCount:           caTotal,
        caEnabled:         caEnabled,
        defenderOffice:    hasDefenderOffice,
        intune:            summary.devices?.available ?? false,
        edr:               hasEdr,
        purview:           hasPurview,
        entraP1:           hasEntraP1,
        backup:            summary.backup?.hasBackup ?? false,
        backupProvider:    summary.backup?.provider  || null,
        externalSharing:   summary.externalSharing
      },

      licenses: lics,

      risks: {
        score,
        risks:         normalisedRisks,
        criticalCount,
        highCount,
        coveredCount
      },

      positives,

      recommendation: {
        product:     recommendation.primary?.key   || 'besafe_essentials',
        name:        recommendation.primary?.name  || '',
        reasoning:   recommendation.reasoning      || '',
        alternative: recommendation.alternative?.key || null
      },

      securitySettings: summary.securitySettings,
      secureScoreControls: summary.secureScoreControls
    });

  } catch (e) {
    console.error('[BeAudit] Error en /api/summary:', e.message);
    res.status(500).json({
      error: e.message || 'Error interno al consultar Microsoft Graph API',
      hint:  'Verifica que la App Registration en Azure tiene los permisos de Graph API correctos.',
      code:  e.response?.data?.error?.code || 'UNKNOWN'
    });
  }
});

// ── POST /api/bee ──────────────────────────────────────────────────────────
const beeLimiter = rateLimit({ windowMs: 60 * 1000, max: 20,
  message: { error: 'Demasiadas peticiones a Bee. Espera un momento.' } });

app.post('/api/bee', beeLimiter, async (req, res) => {
  try {
    const { messages, tenantContext } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY no configurada en el servidor.' });
    }

    const systemPrompt = buildBeeSystemPrompt(tenantContext || {});
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: systemPrompt,
        messages: messages.slice(-10)   // últimos 10 mensajes
      },
      {
        headers: {
          'Content-Type':    'application/json',
          'x-api-key':       process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        timeout: 30000
      }
    );

    const content = response.data.content?.[0]?.text || '';
    res.json({ reply: content });

  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    console.error('[BeAudit] Bee error:', msg);
    res.status(500).json({ error: 'Bee no disponible: ' + msg });
  }
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

// Local dev: start server. Vercel: export app as serverless handler.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('\nBeAudit corriendo en http://localhost:' + PORT);
    console.log('  Health: http://localhost:' + PORT + '/api/health');
    console.log('  API:    http://localhost:' + PORT + '/api/summary\n');
  });
}

module.exports = app;
