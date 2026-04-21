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

    // Normalise users array → {total, withoutMfa, list}
    const userList = Array.isArray(summary.users) ? summary.users : [];
    const withoutMfa = userList.filter(u => !u.hasMFA).length;

    // Normalise risks: rename level → severity for the frontend
    const normalisedRisks = risks.map(r => ({
      ...r,
      severity: r.level,
      userPrincipalName: r.userPrincipalName || undefined
    }));

    // Normalise users: expose hasMfa (camelCase) for frontend
    const normalisedUsers = userList.map(u => ({
      ...u,
      hasMfa: u.hasMFA,
      userPrincipalName: u.email
    }));

    // Detect services from licenses
    const lics = Array.isArray(summary.licenses) ? summary.licenses.map(l => l.skuPartNumber) : [];
    const hasDefenderOffice = lics.some(p => ['ATP_ENTERPRISE','THREAT_INTELLIGENCE','SPB','ENTERPRISEPREMIUM','EMSPREMIUM'].includes(p));
    const hasEdr            = lics.some(p => ['DEFENDER_ENDPOINT_P1','DEFENDER_ENDPOINT_P2','ENTERPRISEPREMIUM'].includes(p));
    const hasPurview        = lics.some(p => ['ENTERPRISEPREMIUM','EMSPREMIUM'].includes(p));

    res.json({
      generatedAt: summary.timestamp,
      tenant: summary.tenant,
      users: {
        total:      userList.length,
        withoutMfa: withoutMfa,
        list:       normalisedUsers
      },
      devices: {
        available:    summary.devices?.available ?? false,
        total:        summary.devices?.total ?? 0,
        compliant:    summary.devices?.compliant ?? 0,
        nonCompliant: summary.devices?.nonCompliant ?? 0
      },
      security: {
        secureScore:       summary.secureScore,
        conditionalAccess: summary.conditionalAccess?.enabled > 0,
        defenderOffice:    hasDefenderOffice,
        intune:            summary.devices?.available ?? false,
        edr:               hasEdr,
        purview:           hasPurview,
        backup:            summary.backup?.hasBackup ?? false
      },
      licenses: summary.licenses,
      risks: {
        score,
        risks:         normalisedRisks,
        criticalCount,
        highCount,
        coveredCount
      },
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
    console.log(`\n✅ BeAudit corriendo en http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`   API:    http://localhost:${PORT}/api/summary\n`);
  });
}

module.exports = app;
