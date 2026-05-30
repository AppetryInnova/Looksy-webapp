# Configuración de Cloudflare y Proxies para Looksy en Coolify

Este documento detalla la configuración óptima en Cloudflare para mejorar el rendimiento, proteger la aplicación contra costos elevados de API y asegurar el correcto rastreo de IPs reales en el VPS con Coolify.

---

## 1. Configuración de DNS y SSL/TLS en Cloudflare

Para proteger el dominio personalizado de Looksy (ej: `looksy.app` o tu subdominio activo):

1. **Proxied (Nube Naranja)**: Asegúrate de que el registro DNS principal (`A` o `CNAME`) que apunta al VPS (`5.78.178.102`) tenga el proxy activado (Icono de nube naranja). Esto oculta la IP real de tu servidor de ataques directos.
2. **Modo SSL/TLS**: Configura a **Full** (Completo) o **Full (Strict)**. Esto garantiza que la comunicación entre Cloudflare y el VPS esté 100% cifrada.

---

## 2. Reglas de Caché (Costo $0 y Velocidad)

Para ahorrar ancho de banda y evitar llamadas repetitivas de optimización de imágenes en el Next.js de tu servidor, utilizaremos **Cache Rules** en Cloudflare:

### Regla A: Cachear Recursos Estáticos e Imágenes
- **Nombre**: `Cache Static Assets & Next Images`
- **Expresión (Expression)**:
  `http.request.uri.path starts_with "/_next/static/" or http.request.uri.path starts_with "/images/" or http.request.uri.path starts_with "/_next/image"`
- **Configuración**:
  - **Cache status**: Eligible for cache
  - **Edge TTL**: Respect origin headers (or Override to 7 days)
  - **Browser TTL**: 7 days

### Regla B: Bypass de Caché para Rutas Dinámicas
- **Nombre**: `Bypass Cache for Dynamic Content`
- **Expresión**:
  `http.request.uri.path starts_with "/api/" or http.request.uri.path starts_with "/es/profile" or http.request.uri.path starts_with "/es/settings" or http.request.uri.path starts_with "/es/marketplace"`
- **Configuración**:
  - **Cache status**: Bypass cache

---

## 3. Seguridad WAF: Protección de Costos de API (Tokens de Gemini / VTO)

Como el análisis de belleza y el Virtual Try-On consumen tokens y APIs costosas, implementaremos reglas de **WAF (Web Application Firewall)** y **Rate Limiting** para proteger estos endpoints:

1. **Rate Limiting para Análisis y VTO**:
   - **Ruta**: `/api/analyze` y `/api/vto`
   - **Criterio**: Si un usuario realiza más de 5 peticiones en 1 minuto.
   - **Acción**: Bloquear temporalmente por 1 hora o mostrar un reto interactivo (Managed Challenge).
2. **Bloqueo de Bots**: Activa el **Bot Fight Mode** en la pestaña de Seguridad de Cloudflare para mitigar scrapers automatizados que puedan consumir recursos.

---

## 4. Configurar Traefik en Coolify para obtener IPs Reales

Por defecto, cuando activas Cloudflare, Next.js y Next-Auth verán que todas las conexiones provienen de las direcciones IP de Cloudflare en lugar de la IP real del usuario. Para solucionar esto en Coolify:

1. Ve a tu panel de **Coolify**.
2. Ve a **Destinations** (Destinos) -> **Local** (o tu servidor activo).
3. Selecciona la configuración de **Traefik** (el proxy inverso predeterminado de Coolify).
4. En la sección de configuración de Traefik, busca los campos de "Custom Configuration" o edita el archivo dinámico agregando las cabeceras de confianza de Cloudflare.
5. Agrega el siguiente bloque de middleware de redirección en las configuraciones de Traefik para indicar que confíe en los proxies de Cloudflare:

```yaml
# Configuración sugerida para Traefik v2 (en Coolify)
entryPoints:
  websecure:
    forwardedHeaders:
      trustedIPs:
        # IPs de Cloudflare (IPv4)
        - "173.245.48.0/20"
        - "103.21.244.0/22"
        - "103.22.200.0/22"
        - "103.31.4.0/22"
        - "141.101.64.0/18"
        - "108.162.192.0/18"
        - "190.93.240.0/20"
        - "188.114.96.0/20"
        - "197.234.240.0/22"
        - "198.41.128.0/17"
        - "162.158.0.0/15"
        - "104.16.0.0/13"
        - "104.24.0.0/14"
        - "172.64.0.0/13"
        - "131.0.72.0/22"
```

Esto asegurará que `request.headers.get('x-forwarded-for')` o `CF-Connecting-IP` en Next.js devuelvan la IP real del celular de tu usuario final.
