'use strict';
require('dotenv').config();
const { ConfidentialClientApplication } = require('@azure/msal-node');

const msalConfig = {
  auth: {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}`
  }
};

const pca = new ConfidentialClientApplication(msalConfig);

async function getToken() {
  const result = await pca.acquireTokenByClientCredential({
    scopes: ['https://graph.microsoft.com/.default']
  });
  if (!result || !result.accessToken) {
    throw new Error('No se pudo obtener el token de acceso de Microsoft.');
  }
  return result.accessToken;
}

module.exports = { getToken };
