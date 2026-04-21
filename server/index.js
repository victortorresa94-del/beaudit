'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { getSummary } = require('./graph');
const { calculateRisks } = require('./scoring');
const { getRecommendation } = require('./recommendations');

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
      }
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
