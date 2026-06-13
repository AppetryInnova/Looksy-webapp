# Hoja de Ruta y Arquitectura de Lanzamiento: Looksy

Este documento presenta un análisis estratégico del estado de Looksy, la arquitectura recomendada para el lanzamiento y el plan paso a paso para lograr una aplicación de consumo (móvil) 100% nativa y pulida, y un panel de negocio (web) robusto para marcas e influencers.

---

## 1. Arquitectura del Sistema: Web vs. Móvil

Para lograr un lanzamiento exitoso y de alta calidad técnica, la división de responsabilidades recomendada es:

```mermaid
graph TD
    subgraph Cliente Final (99% Tráfico)
        MobileApp[Looksy Mobile App: Flutter] -->|Cámara y Cámara de Escáner| NativeFeatures[Filtros, Análisis Facial y VTO]
    end

    subgraph Socios y Creadores (Uso de Escritorio)
        WebApp[Looksy Web Portal: Next.js] -->|Panel Admin| BrandStores[Creación de Campañas y Tiendas]
        WebApp -->|Panel de Control| InfluencerDashboard[Métricas de Engagement]
    end

    subgraph Backend Unificado (Tiempo Real)
        Database[(Supabase PostgreSQL)] <--> MobileApp
        Database <--> WebApp
        Storage[(Supabase Storage)] <--> MobileApp
        Storage <--> WebApp
        AI[APIs Gemini / VTO Engine] <--> Database
    end
```

---

## 2. Decisión del Stack Móvil: ¿Flutter o Nativo Puro (Swift/Kotlin)?

Para cumplir tu meta de lanzar una aplicación móvil que no requiera reescrituras estructurales y se sienta 100% nativa:

### Comparativa:

| Criterio | Nativo Puro (Swift / Kotlin) | Flutter (Compilado a Nativo) |
| :--- | :--- | :--- |
| **Tiempo de desarrollo** | 🔴 Lento (Debes escribir cada función y diseño dos veces: uno para iOS y otro para Android). | 🟢 Rápido (Un solo código fuente compartido para ambas plataformas). |
| **Rendimiento** | 🟢 Máximo (Acceso directo a APIs del SO). | 🟢 Excelente (Flutter compila a código binario nativo ARM, no usa WebViews). |
| **Sensación UX/UI** | 🟢 100% Nativo por defecto. | 🟡 Personalizable (Requiere pulir animaciones y adaptabilidad para simular el comportamiento nativo). |
| **Costo de equipo** | 🔴 Alto (Requiere desarrolladores especializados en Android y otros en iOS). | 🟢 Eficiente (Un solo desarrollador o equipo mantiene todo el ecosistema móvil). |

### Recomendación Estratégica:
**Mantener Flutter como la tecnología móvil**, pero aplicando pautas de desarrollo de **Alta Fidelidad Nativa (High-Fidelity)**. Con las optimizaciones correctas, un usuario final no podrá distinguir si la app está hecha en Flutter o en Kotlin/Swift.

---

## 3. Hoja de Ruta de Desarrollo (Roadmap de Lanzamiento)

Para lograr un producto robusto y listo para tiendas (App Store / Play Store), organizamos las tareas en 4 fases:

```
[Fase 1: Paridad de Funciones] ──> [Fase 2: Optimización Nativa] ──> [Fase 3: Seguridad y CI/CD] ──> [Fase 4: Monetización]
```

### Fase 1: Paridad de Funciones Móviles (Completar placeholders)
Actualmente, el proyecto web tiene funciones avanzadas que faltan en la app móvil. Debemos implementarlas en Flutter:
1. **Feed Social Inmersivo (Estilo TikTok/Instagram)**: Reemplazar las vistas estáticas por un scroll inmersivo vertical de fotos de looks, con soporte para dar likes, ver comentarios y compartir.
2. **Sistema de Batallas de Estilo (Battles) y Desafíos**: Pantalla nativa para votar entre dos outfits en competencia directa y ver las recompensas/XP acumulados.
3. **Mapa de Tiendas y Boutiques**: Integración de mapas nativos (`google_maps_flutter`) para mostrar tiendas físicas basadas en la geolocalización del dispositivo.
4. **Virtual Try-On (VTO)**: Integración con la cámara para enviar la prenda seleccionada a los trabajos asíncronos de VTO en la base de datos.
5. **Notificaciones Push**: Vinculación de Firebase Cloud Messaging (FCM) con la tabla `PushSubscription` para notificar al usuario de comentarios, likes o nuevos desafíos.

### Fase 2: Pulido y UX Premium (Garantizar Calidad a Largo Plazo)
Para que la app no requiera cambios durante mucho tiempo:
1. **Caché Inteligente de Imágenes**: Integrar `cached_network_image` para evitar que las fotos de moda se recarguen constantemente al hacer scroll, ahorrando datos al usuario.
2. **Detección de Calidad de Fotos en Dispositivo**: Usar **Google ML Kit** localmente en la app. Antes de enviar una foto a la API de Gemini (que tiene un costo), la app validará que haya un rostro visible, buena iluminación y que la foto no esté borrosa.
3. **Almacenamiento Seguro**: Implementar `flutter_secure_storage` para guardar de forma cifrada los tokens de sesión y contraseñas.
4. **Gestión de Estado**: Asegurar una estructura limpia con `Riverpod` para facilitar la escalabilidad del código.

### Fase 3: Infraestructura, Seguridad y Despliegue Automatizado
1. **WAF en Cloudflare**: Activar reglas de limitación de tasa (Rate Limit) para que las llamadas que consumen recursos (como los endpoints de IA de Gemini y VTO) no sean abusadas en producción.
2. **Entorno de Staging**: Crear una base de datos de pruebas (Staging) separada de la producción para ensayar nuevas características sin alterar los datos reales de los usuarios.
3. **CI/CD para Apps**: Configurar pipelines de compilación automática en **Codemagic** o **Fastlane** para que cada cambio subido a la rama `main` compile y envíe automáticamente la app a Google Play Beta y TestFlight (iOS).

### Fase 4: Monetización de Afiliados Avanzada
1. **Feed Inteligente del Marketplace**: Expandir la base de datos de productos afiliados con integraciones directas a APIs de catálogos (Mercado Libre, Zara, Renner).
2. **Reportería de Clics**: Crear un panel de administración en Next.js para que puedas ver qué marcas, categorías y prendas generan más clics de afiliados, maximizando los ingresos residuales.

---

## 4. Herramientas y Paquetes Recomendados para Mobile (Flutter)

Para robustecer la app en Flutter y asegurar que se comporte de forma impecable:

* **Para Multimedia y Carga Veloz:**
  * `cached_network_image`: Para almacenamiento de imágenes en memoria caché local del teléfono.
  * `shimmer`: Esqueletos de carga fluidos y premium mientras cargan las fotos de las prendas.
* **Para Hardware y Localización:**
  * `google_maps_flutter`: Para renderizar mapas nativos con alta fluidez de frames.
  * `camera` / `image_picker`: Captura de imágenes a resolución óptima.
* **Para Seguridad e IA:**
  * `flutter_secure_storage`: Cifrado de credenciales a nivel de llavero del sistema (Keychain/Keystore).
  * `google_mlkit_face_detection`: Detección local del rostro previo al escaneo para ahorrar costos de API.
