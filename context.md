# BeAudit — Documento de contexto completo

> **Última actualización:** Abril 2026  
> **Responsable:** Victor Torres · victor.torres@beservices.es  
> **Repositorio:** https://github.com/victortorresa94-del/beaudit  
> **Producción:** Vercel (auto-deploy desde `master`)

---

## 1. Qué es BeAudit

BeAudit es una herramienta de diagnóstico de seguridad Microsoft 365 desarrollada internamente por BeServices. Lee datos reales del tenant del cliente vía Microsoft Graph API (sin acceso a correo ni archivos), calcula una puntuación de riesgo y genera recomendaciones comerciales mapeadas a los productos Besafe.

**Resumen en una frase:** Un consultor de BeServices abre BeAudit en una reunión con el cliente, pulsa un botón, y en 20-30 segundos tiene el estado real de seguridad del tenant en pantalla — con datos de Microsoft, no de una encuesta.

### Qué NO es
- No es un escáner de vulnerabilidades
- No accede a correo, archivos ni datos personales
- No escribe nada en el tenant del cliente
- No es un producto de venta directa — es una herramienta de apoyo comercial

---

## 2. Estrategia comercial

### El problema que resuelve
Los clientes potenciales de BeServices suelen contestar "nosotros ya estamos protegidos" cuando el comercial habla de seguridad. No hay datos concretos que refuten esa percepción. El ciclo de venta se alarga porque el cliente no ve el riesgo.

### El momento clave de uso (Product Moment)
```
Comercial llega a la reunión con el cliente
→ Abre BeAudit en el navegador del portátil
→ Introduce las credenciales del tenant (preparadas antes por el cliente con el script PowerShell)
→ En 30 segundos: dashboard con datos reales del tenant en pantalla
→ El cliente ve sus propios riesgos — no casos genéricos
→ La conversación cambia de "no creo que nos afecte" a "¿esto cómo se arregla?"
```

### Objetivo primario
Acortar el ciclo de venta de los productos Besafe convirtiendo la visita comercial en una sesión de diagnóstico con datos reales. El cliente sale de la reunión con un problema concreto identificado y un plan de acción recomendado.

### Uso secundario (Bee AI)
Después de la reunión, el cliente puede quedar navegando el dashboard solo con dudas. Bee (asistente de IA integrado) responde preguntas usando los datos reales del tenant — sin necesitar al comercial. Actúa como puente entre la reunión y la firma.

### Productos que genera BeAudit como recomendación

| Producto | Precio impl. | MRR | Cuándo se recomienda |
|---|---|---|---|
| **Besafe Essentials** | ~5.000€ | Desde 3€/usuario/mes | Riesgos de identidad y email (MFA, CA, Defender Office) |
| **Besafe Advanced** | ~8.000€ | Desde 5€/usuario/mes | 2+ riesgos críticos + dispositivos expuestos |
| **Besafe Plus** | Desde 6.000€ | 3€/buzón/mes + seguridad | Sin backup externo M365 |
| **Besafe Total** | Desde 14.000€ | Desde 8€/usuario/mes | Secure Score <30% o 2+ críticos + sin backup |

Productos adicionales que puede mencionar Bee: **BeBackup** (standalone desde 3€/buzón/mes), **BeHelp** (soporte gestionado — Month, Pack o On Demand).

---

## 3. Stack técnico

### Arquitectura

```
Cliente (navegador)
    └── SPA Vanilla JS (client/)
            ↕ fetch /api/*
        Express.js (server/)
            ├── Microsoft Graph API (datos del tenant)
            └── Anthropic API (Bee AI)
```

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express 4.18
- **Autenticación M365:** `@azure/msal-node` — OAuth2 client credentials flow (app-only, sin usuario)
- **HTTP client:** Axios 1.6
- **Rate limiting:** `express-rate-limit` — 5 req/min en `/api/summary`, 20 req/min en `/api/bee`
- **Variables de entorno:** `dotenv` con `override: true`
- **IA:** Anthropic API → `claude-haiku-4-5-20251001`, max_tokens 1000, temperature 0.3

### Frontend
- **SPA Vanilla JS** — sin frameworks, sin build step
- **Fuentes:** Inter + Space Grotesk (Google Fonts CDN)
- **Iconos:** SVGs inline
- **CSS:** Custom properties (Design System BeServices), sin Tailwind ni librerías

### Deploy
- **Plataforma:** Vercel (plan Hobby o Pro)
- **Config:** `vercel.json` con un único build `@vercel/node` → todo enrutado por Express
- **CI/CD:** Auto-deploy en push a `master`
- **Variables de entorno en Vercel:** TENANT_ID, CLIENT_ID, CLIENT_SECRET, ANTHROPIC_API_KEY

### Estructura de ficheros

```
beaudit/
├── .env                       ← credenciales locales (NO se sube a git)
├── .gitignore
├── vercel.json                ← config Vercel (build único Express)
├── package.json
├── BeAudit-Setup.ps1          ← script PowerShell para cliente
├── server/
│   ├── index.js               ← Express, endpoints, lógica principal, Bee
│   ├── auth.js                ← MSAL lazy init, getToken()
│   ├── graph.js               ← 10 funciones Graph API + getSummary()
│   ├── scoring.js             ← RISK_MATRIX (13 reglas), calculateRisks()
│   └── recommendations.js    ← BESERVICES_PRODUCTS, getRecommendation()
└── client/
    ├── index.html             ← SPA — 5 páginas + Bee widget
    ├── styles.css             ← Design System, ~2100 líneas
    └── app.js                 ← Toda la lógica DOM, ~1130 líneas
```

---

## 4. Cómo funciona técnicamente

### Conexión al tenant del cliente
1. El cliente ejecuta `BeAudit-Setup.ps1` (PowerShell, ~2 min) — crea App Registration en Azure, asigna 8 permisos de solo lectura, genera secreto
2. El cliente manda 3 valores a BeServices: Tenant ID, Client ID, Client Secret
3. BeServices los pone en el `.env` del servidor (o en Vercel env vars)
4. Desde ese momento, BeAudit puede consultar ese tenant

### Permisos Graph API requeridos (solo lectura, sin datos personales)
- `Organization.Read.All` — nombre del tenant, dominios
- `User.Read.All` — lista de usuarios y licencias
- `UserAuthenticationMethod.Read.All` — métodos de MFA por usuario
- `Directory.Read.All` — roles de directorio (admins globales)
- `Policy.Read.All` — acceso condicional, security defaults, políticas de invitación
- `DeviceManagementManagedDevices.Read.All` — Intune (si disponible)
- `SecurityEvents.Read.All` — Secure Score
- `Sites.Read.All` — SharePoint (external sharing)

### Flujo de datos
```
GET /api/summary
  → getSummary() [Promise.all de 10 funciones Graph]
      ├── getTenantInfo()          → nombre, dominio
      ├── getSubscribedSkus()      → licencias activas
      ├── getUsers()               → usuarios + métodos MFA (paralelo)
      ├── getManagedDevices()      → Intune (try/catch → available:false)
      ├── getConditionalAccessPolicies() → CA (try/catch → available:false)
      ├── getSecureScore()         → score oficial Microsoft
      ├── getExternalSharing()     → SharePoint sites externos
      ├── getBackupStatus()        → detecta Veeam/Acronis en assignedPlans
      ├── getSecuritySettings()    → security defaults, guest policy, admin roles
      └── getSecureScoreControls() → top controles accionables
  → calculateRisks(summary)       → 13 reglas evaluadas
  → getRecommendation(risks, n)   → plan Besafe recomendado
  → res.json({...})
```

### Detección de MFA por usuario
Para cada usuario con licencia se llama `/users/{id}/authentication/methods` y se buscan métodos del tipo:
- `#microsoft.graph.microsoftAuthenticatorAuthenticationMethod`
- `#microsoft.graph.phoneAuthenticationMethod`
- `#microsoft.graph.fido2AuthenticationMethod`

Si el usuario tiene ≥1 de estos métodos → `hasMFA: true`.

---

## 5. Motor de riesgos (13 reglas)

| ID | Nivel | Área | Qué detecta |
|---|---|---|---|
| `mfa_disabled` | 🔴 Critical | Identidad | Usuarios con licencia sin MFA |
| `no_conditional_access` | 🔴 Critical | Identidad | Sin políticas de CA |
| `no_defender_office` | 🔴 Critical | Email | Sin Defender for Office P1/P2 |
| `no_security_defaults` | 🔴 Critical | Identidad | Security Defaults OFF y sin CA |
| `no_intune` | 🟠 High | Dispositivos | Sin Intune o dispositivos no conformes |
| `no_edr` | 🟠 High | Dispositivos | Sin Defender for Endpoint |
| `no_backup` | 🟠 High | Backup | Sin backup externo M365 |
| `external_sharing` | 🟠 High | Datos | >2 sitios SharePoint con compartición externa |
| `too_many_global_admins` | 🟠 High | Identidad | >3 administradores globales activos |
| `guest_access_open` | 🟡 Medium | Identidad | Política de invitación de guests abierta |
| `no_purview` | 🟡 Medium | Datos | Sin DLP (Purview) |
| `low_secure_score` | 🟡 Medium | General | Secure Score <40% |
| `basic_plan` | ℹ️ Info | Licencias | Plan sin capacidades de seguridad (Basic/Standard) |

**Scoring:** Empieza en 100. Cada critical resta 20 pts, cada high resta 10, cada medium resta 5. Mínimo 0.

---

## 6. Páginas del dashboard

La app es un SPA con sidebar de navegación. 5 páginas:

### Resumen (Overview)
- Score ring animado (SVG)
- 4 KPIs: usuarios, Secure Score, dispositivos, hallazgos
- Capas de seguridad (servicios activos con dot on/partial/off)
- Hallazgos críticos resumidos + botón "Ver todos"
- Servicios activos y barras de cobertura
- Positivos (lo que ya está bien)
- **Zero Trust Assessment** — 6 pilares (Identity, Devices, Apps, Data, Infrastructure, Network) con score calculado desde datos reales

### Usuarios
- Tabla completa de usuarios con licencia
- Estado MFA por usuario (badge rojo/verde)
- Búsqueda y filtro (todos / sin MFA / con MFA)
- 3 KPIs: total, sin MFA, con MFA

### Hallazgos
- Lista completa de riesgos con drawer de detalle al hacer click
- 4 KPIs por nivel (critical/high/medium/ok)
- Panel de licencias Microsoft 365 activas
- **Secure Score Controls** — top 15 acciones de mejora recomendadas por Microsoft, con esfuerzo estimado y puntos de mejora

### MITRE ATT&CK
- Matriz completa de 10 tácticas × 35 técnicas para M365
- Simulador de planes Besafe (Actual / Essentials / Advanced / Plus / Total)
- Chips horizontales de productos activos
- Al hacer click en una técnica → drawer derecho con:
  - Descripción del ataque
  - Qué productos cubren / no cubren esa técnica
  - Estado activo/inactivo de cada producto
  - Link a MITRE ATT&CK oficial

### Recomendaciones
- Card principal (plan recomendado) + card alternativa
- Razonamiento generado dinámicamente
- Tabla comparativa de todos los planes Besafe
- Botón "Generar propuesta" → mailto a comercial@beservices.es con contexto del tenant

---

## 7. Bee — AI Security Advisor

### Qué es
Asistente de IA flotante integrado en el dashboard. Responde preguntas sobre el tenant usando los datos reales del diagnóstico. Modelo: `claude-haiku-4-5-20251001` (respuestas en <3s, económico).

### Cuándo se usa
Después de la reunión comercial, cuando el cliente navega el dashboard solo. Bee actúa como consultor disponible 24/7 que ya conoce la situación concreta del tenant.

### Arquitectura Bee
```
Frontend → POST /api/bee
  Body: { messages: [...], tenantContext: { tenantName, secureScore, criticalCount, ... } }
  
Server → buildBeeSystemPrompt(tenantContext)
  → Anthropic API (claude-haiku-4-5-20251001)
  → res.json({ reply: "..." })
```

El system prompt inyecta 11 variables del tenant en tiempo real: nombre, dominio, Secure Score, riesgos críticos/altos, usuarios sin MFA, plan Microsoft, top 3 hallazgos, producto recomendado.

### Interfaz
- **Trigger:** Botón flotante (bottom-right, navy, SVG abeja, badge rojo de notificación)
- **Widget:** Panel 380×560px con animación slide-in
- **4 tabs:**
  - 🏠 Home — quick actions basadas en los 3 riesgos reales del tenant
  - 📊 Insights — resumen estático de los top hallazgos
  - 💡 Recs — plan Besafe recomendado con CTA mailto
  - 🕐 History — historial de conversación (no persistente)
- **Auto-welcome:** Si hay riesgos críticos, Bee inicia la conversación automáticamente al primer abrir
- **Icono:** SVG tipográfico consistente en trigger, header y burbujas de chat (no emoji)

---

## 8. Design System aplicado

### Colores principales
```css
--navy:    #001A41   /* backgrounds sidebar, headers */
--blue:    #0075F2   /* CTAs, links, Bee header */
--cyan:    #50CABF   /* acentos, elementos secundarios */
--ok:      #059669   /* verde — estado correcto */
--high:    #D97706   /* naranja — riesgo alto */
--critical:#DC2626   /* rojo — riesgo crítico */
--bg:      #F1F5F9   /* fondo general del dashboard */
```

### Tipografía
- **Inter** — cuerpo, labels, datos
- **Space Grotesk** — títulos, números grandes

### Componentes clave
- `.panel` — tarjeta blanca con shadow
- `.kpi-card` — métrica con icono coloreado
- `.risk-item` — hallazgo con badge de nivel
- `.sb-item` — navegación sidebar
- Score ring — SVG animado con `stroke-dasharray`

---

## 9. Guía de conexión al tenant (BeAudit-Setup.ps1)

Script PowerShell que el cliente ejecuta una vez:
1. Conecta a Azure con `Connect-AzureAD`
2. Crea App Registration llamada "BeAudit Diagnostico"
3. Asigna los 8 permisos Graph API de solo lectura
4. Genera Client Secret con expiración 1 año
5. Imprime Tenant ID, Client ID y Client Secret en consola + guarda en archivo

El cliente envía estos 3 valores a BeServices → se añaden a las env vars del servidor.

---

## 10. Variables de entorno

### Locales (`.env` — nunca se sube a git)
```
TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-api03-...
PORT=3001
```

### En Vercel (Settings → Environment Variables)
Las mismas 4 variables (sin PORT — Vercel lo asigna automáticamente):
- `TENANT_ID`
- `CLIENT_ID`
- `CLIENT_SECRET`
- `ANTHROPIC_API_KEY`

---

## 11. Comandos de desarrollo

```bash
# Instalar dependencias
npm install

# Desarrollo local (con nodemon)
npm run dev

# Producción local
npm start

# Servidor corre en http://localhost:3001
# Health check: GET /api/health
# Diagnóstico: GET /api/summary
# Bee: POST /api/bee
```

### Reiniciar servidor en Windows (matar proceso previo)
```powershell
# Encontrar PID
netstat -ano | findstr :3001 | findstr LISTENING

# Matar proceso
taskkill /PID <PID> /F

# Arrancar nuevo (background)
Start-Process -FilePath "node" -ArgumentList "server/index.js" -WorkingDirectory "C:\Users\VictorTorres\Desktop\BEAUDIT" -WindowStyle Hidden
```

---

## 12. Novedades Microsoft que conoce Bee

- **Microsoft 365 E7** (disponible mayo 2026, ~99 USD/usuario): E5 + Copilot + agentes autónomos
- **Subida de precios Microsoft** en julio 2026
- **Defender Suite** y **Purview Suite** como add-ons de Business Premium desde sept 2025 (~10€/usuario/mes cada uno)
- **NIS2** y **EU AI Act** en vigor — las empresas deben documentar su postura de seguridad

---

## 13. Roadmap / Próximos pasos posibles

- [ ] Multi-tenant: soporte para cambiar credenciales desde la propia UI (campo de configuración protegido)
- [ ] Exportación PDF automática del informe completo
- [ ] Histórico de diagnósticos — comparar estado mes a mes
- [ ] Integración con HubSpot — crear deal automáticamente desde el dashboard
- [ ] Modo presentación — pantalla fullscreen optimizada para proyectar en reunión
- [ ] Informe ejecutivo generado por Bee (PDF descargable, sin tecnicismos)
- [ ] Soporte Google Workspace — misma lógica con Google Admin SDK

---

## 14. Decisiones técnicas tomadas

| Decisión | Alternativa descartada | Motivo |
|---|---|---|
| Vanilla JS en frontend | React / Vue | Sin build step, carga instantánea, sin dependencias frontend |
| Express en Vercel (un solo handler) | Vercel static + functions por separado | Evita bugs de routing con `client/**` glob en `@vercel/static` |
| MSAL lazy init en auth.js | Init a nivel de módulo | Si las env vars faltan, el error es claro en el endpoint, no un crash de startup |
| `dotenv` con `override: true` | Sin override | En Windows, `ANTHROPIC_API_KEY` puede estar definida vacía en el entorno del sistema — override fuerza los valores del `.env` |
| claude-haiku para Bee | claude-sonnet | Coste y latencia — Bee responde en <3s, haiku es suficiente para este caso |
| Promise.all para Graph API | Llamadas secuenciales | El tenant tarda 20-30s total; en secuencial serían 2-3 minutos |

---

*BeAudit es un proyecto interno de BeServices — no distribuir externamente.*  
*Contacto técnico: victor.torres@beservices.es*
