# Guía de Configuración de Servidores MCP (Model Context Protocol)

Model Context Protocol (MCP) permite a tu asistente de IA (como Claude Desktop u otros agentes compatibles) conectarse a tus herramientas y datos directamente de forma segura.

En Looksy, hemos preparado configuraciones para conectar **Figma** (diseño) y **Supabase** (base de datos de producción) para que el asistente pueda:
1. Leer tus mockups y diseños en Figma para transformarlos instantáneamente en código React/Tailwind.
2. Hacer consultas rápidas SQL a tu base de datos Supabase para soporte o depuración sin tener que abrir Prisma Studio o correr código localmente.

---

## 1. Servidor Figma MCP

Este servidor permite a la IA leer archivos de diseño, nodos, imágenes y estilos desde Figma.

### Requisitos:
1. Abre Figma y ve a **Settings** (Configuración) -> **Account** (Cuenta).
2. Desplázate hasta **Personal Access Tokens** (Tokens de acceso personal).
3. Crea un nuevo token llamado `Looksy-Developer-Token`.
4. Copia el token generado.

### Configuración:
1. Abre el archivo [figma-mcp.json](file:///e:/Looksy/Looksy%20Gravity%20App/mcp-config/figma-mcp.json).
2. Reemplaza `YOUR_FIGMA_PERSONAL_ACCESS_TOKEN_HERE` por tu token copiado.
3. Copia el bloque `"figma"` dentro del archivo de configuración global de tu cliente de IA (ej: `Claude Desktop` se configura en `%APPDATA%\Claude\claude_desktop_config.json`).

---

## 2. Servidor Supabase MCP

Este servidor permite a la IA interactuar con la base de datos PostgreSQL de tu Supabase de forma segura, inspeccionando tablas, ejecutando consultas SELECT y describiendo esquemas.

### Requisitos:
1. Ve al panel de control de **Supabase**.
2. Ve a **Project Settings** (Configuración del proyecto) -> **Database** (Base de datos).
3. Obtén tu cadena de conexión (URI) de Postgres. Recuerda usar el puerto directo `5432` en lugar del puerto de pools de transacciones `6543` para optimizar las consultas ad-hoc.
4. Ten a mano la contraseña de la base de datos de tu proyecto.

### Configuración:
1. Abre el archivo [supabase-mcp.json](file:///e:/Looksy/Looksy%20Gravity%20App/mcp-config/supabase-mcp.json).
2. Reemplaza la URL `"postgresql://..."` con tus credenciales reales de conexión de Supabase.
3. Copia el bloque `"supabase-postgres"` a la configuración global de tu cliente de IA.

---

## 3. Instalación Global en Claude Desktop

Si usas Claude Desktop en Windows, puedes combinar ambas configuraciones editando tu archivo de configuración global:

### Ruta del archivo:
Presiona `Win + R`, escribe `%APPDATA%\Claude` y abre el archivo `claude_desktop_config.json`. Si no existe, créalo con la siguiente estructura:

```json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-figma"
      ],
      "env": {
        "FIGMA_PERSONAL_ACCESS_TOKEN": "tu_token_de_figma_aqui"
      }
    },
    "supabase-postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://postgres.[tu-id-proyecto]:[tu-contraseña]@aws-1-sa-east-1.pooler.supabase.com:5432/postgres"
      ]
    }
  }
}
```

Reinicia Claude Desktop. Verás un nuevo icono de enchufe (🔌) en la interfaz de chat indicando que tienes acceso a Figma y a la base de datos.
