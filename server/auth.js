'use strict';
const { ConfidentialClientApplication } = require('@azure/msal-node');

// Lazy initialization — created on first getToken() call so missing
// env vars produce a clear error message instead of crashing at startup.
let _pca = null;

function getPca() {
  if (_pca) return _pca;
  const tenantId = process.env.TENANT_ID;
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;
  if (!tenantId || !clientId || !clientSecret) {
    throw new Error(
      'Credenciales de Azure no configuradas. ' +
      'Añade TENANT_ID, CLIENT_ID y CLIENT_SECRET en las variables de entorno.'
    );
  }
  _pca = new ConfidentialClientApplication({
    auth: {
      clientId,
      clientSecret,
      authority: `https://login.microsoftonline.com/${tenantId}`
    }
  });
  return _pca;
}

async function getToken() {
  const pca = getPca();
  const result = await pca.acquireTokenByClientCredential({
    scopes: ['https://graph.microsoft.com/.default']
  });
  if (!result || !result.accessToken) {
    throw new Error('No se pudo obtener el token de acceso de Microsoft.');
  }
  return result.accessToken;
}

module.exports = { getToken };
