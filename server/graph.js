'use strict';
require('dotenv').config();
const axios = require('axios');
const { getToken } = require('./auth');

const BASE = 'https://graph.microsoft.com/v1.0';

const SKU_NAMES = {
  SPB: 'Microsoft 365 Business Premium',
  O365_BUSINESS_PREMIUM: 'Microsoft 365 Business Standard',
  O365_BUSINESS_ESSENTIALS: 'Microsoft 365 Business Basic',
  ENTERPRISEPACK: 'Microsoft 365 E3',
  ENTERPRISEPREMIUM: 'Microsoft 365 E5',
  DEFENDER_ENDPOINT_P1: 'Defender for Endpoint P1',
  DEFENDER_ENDPOINT_P2: 'Defender for Endpoint P2',
  ATP_ENTERPRISE: 'Defender for Office P1',
  THREAT_INTELLIGENCE: 'Defender for Office P2',
  AAD_PREMIUM: 'Entra ID P1',
  AAD_PREMIUM_P2: 'Entra ID P2',
  INTUNE_A: 'Microsoft Intune',
  'EM+S': 'Enterprise Mobility + Security E3',
  EMSPREMIUM: 'Enterprise Mobility + Security E5'
};

async function graphGet(path) {
  const token = await getToken();
  const res = await axios.get(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 20000
  });
  return res.data;
}

async function getTenantInfo() {
  try {
    const data = await graphGet('/organization');
    const org = data.value[0];
    return {
      available: true,
      displayName: org.displayName,
      verifiedDomains: org.verifiedDomains.map(d => d.name),
      primaryDomain: (org.verifiedDomains.find(d => d.isDefault) || org.verifiedDomains[0])?.name,
      createdDateTime: org.createdDateTime
    };
  } catch (e) {
    return { available: false, reason: e.response?.data?.error?.message || e.message };
  }
}

async function getSubscribedSkus() {
  try {
    const data = await graphGet('/subscribedSkus');
    return data.value.map(sku => ({
      skuPartNumber: sku.skuPartNumber,
      name: SKU_NAMES[sku.skuPartNumber] || sku.skuPartNumber,
      consumedUnits: sku.consumedUnits,
      enabledUnits: sku.prepaidUnits?.enabled || 0
    }));
  } catch (e) {
    return [];
  }
}

async function getUsers() {
  try {
    const data = await graphGet('/users?$select=id,displayName,userPrincipalName,assignedLicenses,accountEnabled&$top=999');
    const activeUsers = data.value.filter(u => u.accountEnabled && u.assignedLicenses?.length > 0);

    // Limit parallel MFA calls to first 100 users for performance
    const usersToCheck = activeUsers.slice(0, 100);
    const mfaResults = await Promise.allSettled(
      usersToCheck.map(u => graphGet(`/users/${u.id}/authentication/methods`))
    );

    const MFA_METHOD_TYPES = [
      '#microsoft.graph.microsoftAuthenticatorAuthenticationMethod',
      '#microsoft.graph.phoneAuthenticationMethod',
      '#microsoft.graph.fido2AuthenticationMethod',
      '#microsoft.graph.windowsHelloForBusinessAuthenticationMethod',
      '#microsoft.graph.softwareOathAuthenticationMethod'
    ];

    const result = usersToCheck.map((u, i) => {
      let hasMFA = false;
      if (mfaResults[i].status === 'fulfilled') {
        const methods = mfaResults[i].value?.value || [];
        hasMFA = methods.some(m => MFA_METHOD_TYPES.includes(m['@odata.type']));
      }
      return {
        id: u.id,
        displayName: u.displayName,
        email: u.userPrincipalName,
        hasLicense: u.assignedLicenses.length > 0,
        hasMFA,
        licenseSkus: u.assignedLicenses.map(l => l.skuId)
      };
    });

    return result;
  } catch (e) {
    return [];
  }
}

async function getManagedDevices() {
  try {
    const data = await graphGet('/deviceManagement/managedDevices?$select=id,deviceName,complianceState,operatingSystem,lastSyncDateTime&$top=999');
    const devices = data.value;
    const compliant = devices.filter(d => d.complianceState === 'compliant').length;
    const nonCompliant = devices.filter(d => d.complianceState !== 'compliant').length;
    return {
      available: true,
      total: devices.length,
      compliant,
      nonCompliant,
      unmanaged: 0,
      devices: devices.map(d => ({
        name: d.deviceName,
        os: d.operatingSystem,
        complianceState: d.complianceState,
        lastSync: d.lastSyncDateTime
      }))
    };
  } catch (e) {
    const status = e.response?.status;
    if (status === 403 || status === 401) {
      return { available: false, reason: 'insufficient_permissions', devices: [], total: 0, compliant: 0, nonCompliant: 0, unmanaged: 0 };
    }
    // Intune not licensed
    return { available: false, reason: 'no_intune_license', devices: [], total: 0, compliant: 0, nonCompliant: 0, unmanaged: 0 };
  }
}

async function getConditionalAccessPolicies() {
  try {
    const data = await graphGet('/identity/conditionalAccess/policies');
    const policies = data.value;
    const enabled = policies.filter(p => p.state === 'enabled').length;
    const disabled = policies.filter(p => p.state !== 'enabled').length;
    return {
      available: true,
      count: policies.length,
      enabled,
      disabled
    };
  } catch (e) {
    const status = e.response?.status;
    if (status === 403 || status === 401) {
      return { available: false, reason: 'insufficient_permissions', count: 0, enabled: 0, disabled: 0 };
    }
    return { available: false, reason: 'no_entra_p1', count: 0, enabled: 0, disabled: 0 };
  }
}

async function getSecureScore() {
  try {
    const data = await graphGet('/security/secureScores?$top=1');
    const score = data.value[0];
    if (!score) return { available: false, currentScore: 0, maxScore: 100, percentage: 0, controlScores: [] };
    const percentage = Math.round((score.currentScore / score.maxScore) * 100);
    return {
      available: true,
      currentScore: score.currentScore,
      maxScore: score.maxScore,
      percentage,
      controlScores: score.controlScores || []
    };
  } catch (e) {
    return { available: false, reason: e.response?.data?.error?.message || e.message, currentScore: 0, maxScore: 100, percentage: 0, controlScores: [] };
  }
}

async function getExternalSharing() {
  try {
    const data = await graphGet('/sites?$select=id,displayName,sharingCapability&$top=100');
    const sites = data.value || [];
    const sitesWithExternal = sites.filter(s =>
      s.sharingCapability && s.sharingCapability !== 'disabled' && s.sharingCapability !== 'existingExternalUserSharingOnly'
    ).length;
    return {
      available: true,
      totalSites: sites.length,
      sitesWithExternal
    };
  } catch (e) {
    return { available: false, reason: e.response?.data?.error?.message || e.message, totalSites: 0, sitesWithExternal: 0 };
  }
}

async function getBackupStatus() {
  try {
    const data = await graphGet('/subscribedSkus');
    const skus = data.value || [];
    const BACKUP_PROVIDERS = ['VEEAM', 'ACRONIS', 'BACKUPIFY', 'AVEPOINT', 'DROPSUITE', 'BARRACUDA'];
    const found = skus.find(s =>
      BACKUP_PROVIDERS.some(p => s.skuPartNumber?.toUpperCase().includes(p))
    );
    return {
      hasBackup: !!found,
      provider: found ? found.skuPartNumber : null
    };
  } catch (e) {
    return { hasBackup: false, provider: null };
  }
}

async function getSummary() {
  const [tenant, licenses, users, devices, conditionalAccess, secureScore, externalSharing, backup] =
    await Promise.all([
      getTenantInfo(),
      getSubscribedSkus(),
      getUsers(),
      getManagedDevices(),
      getConditionalAccessPolicies(),
      getSecureScore(),
      getExternalSharing(),
      getBackupStatus()
    ]);

  return {
    timestamp: new Date().toISOString(),
    tenant,
    licenses,
    users,
    devices,
    conditionalAccess,
    secureScore,
    externalSharing,
    backup
  };
}

module.exports = {
  getTenantInfo,
  getSubscribedSkus,
  getUsers,
  getManagedDevices,
  getConditionalAccessPolicies,
  getSecureScore,
  getExternalSharing,
  getBackupStatus,
  getSummary
};
