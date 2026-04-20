'use strict';

const RISK_MATRIX = [
  {
    id: 'mfa_disabled',
    check: (data) => {
      const usersWithoutMFA = data.users.filter(u => u.hasLicense && !u.hasMFA);
      return usersWithoutMFA.length > 0 ? usersWithoutMFA.length : null;
    },
    level: 'critical',
    title: (count) => `MFA desactivado en ${count} usuarios`,
    description: 'Sin segundo factor de autenticación, una contraseña comprometida da acceso total a la cuenta.',
    affectedArea: 'Identidad',
    microsoftFix: 'Entra ID P1 + Microsoft Authenticator',
    beservicesFix: 'besafe_essentials'
  },
  {
    id: 'no_conditional_access',
    check: (data) => data.conditionalAccess.available && data.conditionalAccess.count === 0,
    level: 'critical',
    title: () => 'Sin políticas de acceso condicional',
    description: 'Cualquier dispositivo desde cualquier lugar puede acceder a los recursos de la empresa.',
    affectedArea: 'Identidad',
    microsoftFix: 'Entra ID P1',
    beservicesFix: 'besafe_essentials'
  },
  {
    id: 'no_defender_office',
    check: (data) => !data.licenses.some(l =>
      ['ATP_ENTERPRISE', 'THREAT_INTELLIGENCE', 'SPB', 'ENTERPRISEPREMIUM', 'EMSPREMIUM'].includes(l.skuPartNumber)
    ),
    level: 'critical',
    title: () => 'Sin protección avanzada de email',
    description: 'Defender for Office no está activo. El correo es el vector de entrada del 91% de los ataques.',
    affectedArea: 'Email',
    microsoftFix: 'Defender for Office P1 o P2',
    beservicesFix: 'besafe_essentials'
  },
  {
    id: 'no_intune',
    check: (data) => {
      if (!data.devices.available) return true;
      return data.devices.nonCompliant > 0 ? data.devices.nonCompliant : null;
    },
    level: 'high',
    title: (count) => count === true ? 'Gestión de dispositivos no configurada' : `${count} dispositivos sin gestionar`,
    description: 'Los dispositivos fuera de Intune no reciben políticas de seguridad ni pueden borrarse remotamente.',
    affectedArea: 'Dispositivos',
    microsoftFix: 'Microsoft Intune (incluido en Business Premium)',
    beservicesFix: 'besafe_advanced'
  },
  {
    id: 'no_edr',
    check: (data) => !data.licenses.some(l =>
      ['DEFENDER_ENDPOINT_P1', 'DEFENDER_ENDPOINT_P2', 'ENTERPRISEPREMIUM'].includes(l.skuPartNumber)
    ),
    level: 'high',
    title: () => 'Sin detección y respuesta en endpoints (EDR)',
    description: 'Sin EDR, un malware puede moverse lateralmente por la red durante días sin ser detectado.',
    affectedArea: 'Dispositivos',
    microsoftFix: 'Defender for Endpoint P1 o P2',
    beservicesFix: 'besafe_advanced'
  },
  {
    id: 'no_backup',
    check: (data) => !data.backup.hasBackup,
    level: 'high',
    title: () => 'Sin backup externo de Microsoft 365',
    description: 'Microsoft no hace backup de tus datos. Si se borran por error o ransomware, no hay recuperación.',
    affectedArea: 'Backup',
    microsoftFix: 'No incluido en M365 — requiere solución externa',
    beservicesFix: 'besafe_plus'
  },
  {
    id: 'external_sharing',
    check: (data) => data.externalSharing.sitesWithExternal > 2 ? data.externalSharing.sitesWithExternal : null,
    level: 'high',
    title: (count) => `${count} sitios con compartición externa activa`,
    description: 'Archivos accesibles fuera del tenant sin auditoría ni control centralizado.',
    affectedArea: 'Datos',
    microsoftFix: 'Purview Information Protection',
    beservicesFix: 'besafe_advanced'
  },
  {
    id: 'no_purview',
    check: (data) => !data.licenses.some(l =>
      ['ENTERPRISEPREMIUM', 'EMSPREMIUM'].includes(l.skuPartNumber)
    ),
    level: 'medium',
    title: () => 'Sin clasificación y protección de datos (DLP)',
    description: 'Sin Purview, los datos sensibles pueden enviarse fuera sin control ni alerta.',
    affectedArea: 'Datos',
    microsoftFix: 'Microsoft Purview (incluido en E5)',
    beservicesFix: 'besafe_advanced'
  },
  {
    id: 'low_secure_score',
    check: (data) => data.secureScore.percentage < 40 ? data.secureScore.percentage : null,
    level: 'medium',
    title: (score) => `Secure Score bajo (${score}%)`,
    description: 'Microsoft detecta configuraciones inseguras en el tenant que aumentan el riesgo de ataque.',
    affectedArea: 'General',
    microsoftFix: 'Múltiples controles de seguridad',
    beservicesFix: 'besafe_essentials'
  },
  {
    id: 'basic_plan',
    check: (data) => data.licenses.some(l =>
      ['O365_BUSINESS_ESSENTIALS', 'O365_BUSINESS_PREMIUM'].includes(l.skuPartNumber)
    ) && !data.licenses.some(l =>
      ['SPB', 'ENTERPRISEPACK', 'ENTERPRISEPREMIUM'].includes(l.skuPartNumber)
    ),
    level: 'info',
    title: () => 'Plan sin capacidades de seguridad avanzada',
    description: 'Business Basic y Standard no incluyen Defender, Intune ni Entra ID P1.',
    affectedArea: 'Licencias',
    microsoftFix: 'Actualizar a Business Premium o superior',
    beservicesFix: 'besafe_essentials'
  }
];

const LEVEL_ORDER = { critical: 0, high: 1, medium: 2, info: 3 };
const LEVEL_DEDUCTION = { critical: 20, high: 10, medium: 5, info: 0 };

function calculateRisks(data) {
  const risks = [];

  for (const rule of RISK_MATRIX) {
    try {
      const value = rule.check(data);
      if (value !== null && value !== false && value !== undefined) {
        risks.push({
          id: rule.id,
          level: rule.level,
          title: rule.title(value),
          description: rule.description,
          affectedArea: rule.affectedArea,
          microsoftFix: rule.microsoftFix,
          beservicesFix: rule.beservicesFix,
          value
        });
      }
    } catch (e) {
      // Rule evaluation failed — skip silently
    }
  }

  // Sort by level
  risks.sort((a, b) => (LEVEL_ORDER[a.level] ?? 99) - (LEVEL_ORDER[b.level] ?? 99));

  // Calculate score
  let score = 100;
  for (const risk of risks) {
    score -= LEVEL_DEDUCTION[risk.level] || 0;
  }
  score = Math.max(0, score);

  const criticalCount = risks.filter(r => r.level === 'critical').length;
  const highCount = risks.filter(r => r.level === 'high').length;

  // "Covered" = total possible risks minus active risks
  const coveredCount = Math.max(0, RISK_MATRIX.length - risks.length);

  return { score, risks, criticalCount, highCount, coveredCount };
}

module.exports = { calculateRisks, RISK_MATRIX };
