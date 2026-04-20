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

    res.json({
      ...summary,
      score,
      risks,
      criticalCount,
      highCount,
      coveredCount,
      recommendation
    });
  } catch (e) {
    console.error('[BeAudit] Error en /api/summary:', e.message);
    res.status(500).json({
      error: e.message || 'Error interno al consultar Microsoft Graph API',
      code: e.response?.data?.error?.code || 'UNKNOWN'
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
