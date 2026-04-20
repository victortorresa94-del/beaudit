'use strict';

const BESERVICES_PRODUCTS = {
  besafe_essentials: {
    key: 'besafe_essentials',
    name: 'Besafe Essentials',
    tagline: 'Protección base del entorno Microsoft 365',
    description: 'Cubre los riesgos críticos de identidad y email. MFA, acceso condicional y protección de correo.',
    includes: [
      'Configuración MFA para todos los usuarios',
      'Políticas de acceso condicional (Entra ID P1)',
      'Defender for Office P1 — antiphishing y antimalware',
      'Revisión y hardening de configuración del tenant',
      'Informe de seguridad inicial',
      'Soporte gestionado mensual'
    ],
    microsoftLicenseRequired: 'Microsoft 365 Business Premium o superior (o add-on Entra ID P1)',
    implementationDays: 13,
    implementationPrice: '~5.000€',
    mrr: 'Desde 3€/usuario/mes',
    color: '#1A73E8',
    tier: 1
  },
  besafe_advanced: {
    key: 'besafe_advanced',
    name: 'Besafe Advanced',
    tagline: 'Seguridad completa en identidades, dispositivos y datos',
    description: 'Añade EDR en endpoints, gestión de dispositivos Intune, detección de shadow IT y protección de datos.',
    includes: [
      'Todo lo de Essentials',
      'Defender for Endpoint P1 — EDR en dispositivos',
      'Microsoft Intune — gestión y políticas en dispositivos',
      'Entra ID P2 — acceso condicional basado en riesgo',
      'Detección de shadow IT y apps no autorizadas',
      'Alertas y monitorización continua',
      'Soporte gestionado mensual prioritario'
    ],
    microsoftLicenseRequired: 'Microsoft 365 Business Premium recomendado',
    implementationDays: 19,
    implementationPrice: '~8.000€',
    mrr: 'Desde 5€/usuario/mes',
    note: 'Requiere implantación previa de Besafe Essentials',
    color: '#001A41',
    tier: 2
  },
  besafe_plus: {
    key: 'besafe_plus',
    name: 'Besafe Plus',
    tagline: 'Seguridad + backup gestionado',
    description: 'Besafe Essentials o Advanced más BeBackup externo de Microsoft 365.',
    includes: [
      'Todo lo de Besafe Essentials o Advanced',
      'Backup externo de correo, OneDrive y SharePoint',
      'Retención configurable (1-7 años)',
      'Recuperación granular por archivo, buzón o sitio',
      'Soporte ante incidencias de pérdida de datos'
    ],
    microsoftLicenseRequired: 'Cualquier plan M365',
    implementationDays: 15,
    implementationPrice: 'Desde ~6.000€',
    mrr: 'Desde 3€/buzón/mes (backup) + seguridad',
    color: '#059669',
    tier: 2
  },
  besafe_total: {
    key: 'besafe_total',
    name: 'Besafe Total',
    tagline: 'Blindaje completo — el modelo Predictby',
    description: 'Auditoría + seguridad completa + backup + disaster recovery. El bundle más completo.',
    includes: [
      'Auditoría de seguridad completa con informe ejecutivo',
      'Besafe Advanced completo',
      'BeBackup externo (correo + OneDrive + SharePoint)',
      'Plan de Disaster Recovery documentado',
      'Simulacro de recuperación anual',
      'vCIO — reuniones trimestrales de revisión estratégica'
    ],
    microsoftLicenseRequired: 'Microsoft 365 Business Premium recomendado',
    implementationDays: 30,
    implementationPrice: 'Desde ~14.000€',
    mrr: 'Desde 8€/usuario/mes',
    color: '#7C3AED',
    tier: 3,
    featured: true
  }
};

function getRecommendation(risks, userCount) {
  const criticalCount = risks.filter(r => r.level === 'critical').length;
  const hasBackupRisk = risks.some(r => r.id === 'no_backup');
  const secureScoreRisk = risks.find(r => r.id === 'low_secure_score');
  const secureScoreValue = secureScoreRisk ? secureScoreRisk.value : 100;

  let primaryKey, alternativeKey, reasoning;

  if (secureScoreValue < 30) {
    primaryKey = 'besafe_total';
    alternativeKey = 'besafe_advanced';
    reasoning = `Secure Score crítico (${secureScoreValue}%) — se requiere intervención completa con Besafe Total para recuperar el control del tenant.`;
  } else if (criticalCount >= 2 && hasBackupRisk) {
    primaryKey = 'besafe_total';
    alternativeKey = 'besafe_advanced';
    reasoning = `${criticalCount} riesgos críticos detectados más ausencia de backup — Besafe Total cubre todos los frentes y añade recuperación ante desastres.`;
  } else if (criticalCount >= 2) {
    primaryKey = 'besafe_advanced';
    alternativeKey = 'besafe_essentials';
    reasoning = `${criticalCount} riesgos críticos detectados. Besafe Advanced cubre identidad, email y dispositivos en un único proyecto de implantación.`;
  } else if (hasBackupRisk && criticalCount === 0) {
    primaryKey = 'besafe_plus';
    alternativeKey = 'besafe_essentials';
    reasoning = 'El principal riesgo es la falta de backup externo. Besafe Plus incluye BeBackup gestionado más la base de seguridad.';
  } else {
    primaryKey = 'besafe_essentials';
    alternativeKey = 'besafe_advanced';
    reasoning = 'Los riesgos detectados se cubren con el paquete de entrada. Besafe Essentials establece la base de identidad y email segura.';
  }

  return {
    primary: BESERVICES_PRODUCTS[primaryKey],
    alternative: BESERVICES_PRODUCTS[alternativeKey],
    reasoning
  };
}

module.exports = { getRecommendation, BESERVICES_PRODUCTS };
