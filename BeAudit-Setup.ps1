#Requires -Version 5.1
<#
.SYNOPSIS
    BeAudit — Setup de App Registration en Microsoft Entra ID
    Ejecuta este script con una cuenta Global Administrator del tenant.
    Crea una App Registration de solo lectura para el diagnostico de seguridad BeAudit.

.NOTES
    Ejecutar como: PowerShell.exe -ExecutionPolicy Bypass -File BeAudit-Setup.ps1
    Requiere: AzureAD o Microsoft.Graph PowerShell module (se instala automaticamente)
#>

$ErrorActionPreference = 'Stop'

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  BeAudit — Configuracion de acceso al tenant  " -ForegroundColor Cyan
Write-Host "  by BeServices | Solo lectura | Seguro RGPD   " -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# ── Instalar modulo si no existe ────────────────────────────────
if (-not (Get-Module -ListAvailable -Name Microsoft.Graph.Applications)) {
    Write-Host "[1/5] Instalando Microsoft.Graph (puede tardar 1-2 min)..." -ForegroundColor Yellow
    Install-Module Microsoft.Graph -Scope CurrentUser -Force -AllowClobber -ErrorAction Stop
}

# ── Conectar a Microsoft Graph ──────────────────────────────────
Write-Host "[2/5] Conectando con Microsoft 365 — se abrira una ventana de login..." -ForegroundColor Yellow
Connect-MgGraph -Scopes "Application.ReadWrite.All","Directory.Read.All" -NoWelcome

$ctx = Get-MgContext
$tenantId = $ctx.TenantId
Write-Host "    Conectado al tenant: $tenantId" -ForegroundColor Green

# ── Crear App Registration ──────────────────────────────────────
Write-Host "[3/5] Creando App Registration 'BeAudit Diagnostico'..." -ForegroundColor Yellow

$appName = "BeAudit Diagnostico"
$existing = Get-MgApplication -Filter "displayName eq '$appName'" -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "    App Registration ya existe. Reutilizando..." -ForegroundColor Cyan
    $app = $existing[0]
} else {
    $app = New-MgApplication -DisplayName $appName -SignInAudience "AzureADMyOrg"
}
$appId = $app.AppId
$objectId = $app.Id

# ── Asignar permisos de API (solo lectura) ──────────────────────
Write-Host "[4/5] Asignando permisos de solo lectura..." -ForegroundColor Yellow

# Microsoft Graph API resource ID
$graphSpId = (Get-MgServicePrincipal -Filter "appId eq '00000003-0000-0000-c000-000000000000'").Id

# Permisos necesarios (Application permissions, solo lectura)
$permissionIds = @(
    "498476ce-e0fe-48b0-b801-37ba7ef9dc52", # Organization.Read.All
    "7ab1d382-f21e-4acd-a863-ba3e13f7da61", # Directory.Read.All
    "38d9df27-64da-44fd-b7c5-a6fbac20248f", # UserAuthenticationMethod.Read.All
    "2f51be20-0bb4-4fed-bf7b-db946066c75e", # DeviceManagementManagedDevices.Read.All
    "246dd0d5-5bd0-4def-940b-0421030a5b68", # Policy.Read.All
    "bf394140-e372-4bf9-a898-299cfc7564e5", # SecurityEvents.Read.All
    "332a536c-c7ef-4017-ab91-336970924f0d", # Sites.Read.All
    "df021288-bdef-4463-88db-98f22de89214"  # User.Read.All
)

$requiredAccess = @{
    ResourceAppId  = "00000003-0000-0000-c000-000000000000"
    ResourceAccess = $permissionIds | ForEach-Object {
        @{ Id = $_; Type = "Role" }
    }
}

Update-MgApplication -ApplicationId $objectId -RequiredResourceAccess @($requiredAccess)

# Crear service principal si no existe
$sp = Get-MgServicePrincipal -Filter "appId eq '$appId'" -ErrorAction SilentlyContinue
if (-not $sp) {
    $sp = New-MgServicePrincipal -AppId $appId
}

# Consentimiento de administrador
try {
    foreach ($pId in $permissionIds) {
        $grant = @{
            ClientId    = $sp.Id
            ConsentType = "AllPrincipals"
            ResourceId  = $graphSpId
            Scope       = $pId
        }
        # Grant each permission
        New-MgOauth2PermissionGrant -BodyParameter @{
            clientId    = $sp.Id
            consentType = "AllPrincipals"
            resourceId  = $graphSpId
            scope       = "Organization.Read.All Directory.Read.All User.Read.All"
        } -ErrorAction SilentlyContinue | Out-Null
    }
} catch { <# Ignorar si ya existe el grant #> }

# ── Crear Client Secret ─────────────────────────────────────────
Write-Host "[5/5] Generando Client Secret (valido 1 ano)..." -ForegroundColor Yellow

$secretParams = @{
    PasswordCredential = @{
        DisplayName = "BeAudit-Secret-$(Get-Date -Format 'yyyyMMdd')"
        EndDateTime = (Get-Date).AddYears(1)
    }
}
$secret = Add-MgApplicationPassword -ApplicationId $objectId -BodyParameter $secretParams
$clientSecret = $secret.SecretText

# ── Resultado final ─────────────────────────────────────────────
Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host "  CONFIGURACION COMPLETADA - Enviar a BeServices" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  TENANT_ID     = $tenantId" -ForegroundColor White
Write-Host "  CLIENT_ID     = $appId" -ForegroundColor White
Write-Host "  CLIENT_SECRET = $clientSecret" -ForegroundColor Yellow
Write-Host ""
Write-Host "  IMPORTANTE: Copia estos 3 valores y envialos" -ForegroundColor Cyan
Write-Host "  a tu consultor de BeServices de forma segura." -ForegroundColor Cyan
Write-Host "  El Client Secret NO se podra recuperar despues." -ForegroundColor Red
Write-Host ""
Write-Host "  Nota: Esta App Registration tiene permisos de" -ForegroundColor Gray
Write-Host "  SOLO LECTURA. No puede modificar nada en tu tenant." -ForegroundColor Gray
Write-Host "================================================" -ForegroundColor Green
Write-Host ""

# Guardar en fichero local tambien
$outputFile = "BeAudit-Credenciales-$(Get-Date -Format 'yyyyMMdd-HHmm').txt"
@"
BeAudit — Credenciales de acceso
Generado: $(Get-Date -Format 'yyyy-MM-dd HH:mm')

TENANT_ID     = $tenantId
CLIENT_ID     = $appId
CLIENT_SECRET = $clientSecret

Enviar a: comercial@beservices.es
ADVERTENCIA: Este fichero contiene credenciales sensibles. Eliminarlo despues de enviarlo.
"@ | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host "  Credenciales guardadas en: $outputFile" -ForegroundColor Cyan
Write-Host "  Elimina el fichero despues de enviarlo a BeServices." -ForegroundColor Yellow
