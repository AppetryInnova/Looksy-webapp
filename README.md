# Looksy Gravity App 🚀

Una plataforma de moda social interactiva y de última generación.

## Arquitectura y Stack Tecnológico

Este proyecto está construido para ser escalable ("Production-Ready") con una latencia mínima enfocada al público en **Sudamérica**.

*   **Frontend:** Next.js 16 (App Router), React 19, CSS Modules (Full Fluid Móvil).
*   **Base de Datos:** PostgreSQL alojada en **Supabase**.
*   **Almacenamiento (Media):** Supabase Cloud Storage (Bucket público: `looksy-media`).
*   **ORM:** Prisma Client (con soporte para *Connection Pooling* vía PgBouncer en el puerto `6543`).
*   **Autenticación:** Híbrido entre NextAuth (PrismaAdapter) manejando sesiones y roles locales en la BD de Supabase.

### 🌎 Preferencia de Región (IMPORTANTE)
Cualquier infraestructura, bucket, o base de datos aprovisionada para Looksy Gravity **debe ser instanciada en la región South America (São Paulo) `sa-east-1`** o equivalentes. Esto aplica para migraciones futuras en Supabase, Vercel, o AWS, para asegurar baja latencia a los usuarios principales.

## Entorno Local de Desarrollo

Asegúrate de tener un archivo `.env` configurado con las credenciales maestras:

```env
# Database (Supabase PostgreSQL - São Paulo SA)
DATABASE_URL="postgresql://postgres.[project-id]:[password]@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-id]:[password]@aws-1-sa-east-1.pooler.supabase.com:5432/postgres"

# Supabase Auth & Storage (South America Region)
NEXT_PUBLIC_SUPABASE_URL="https://[project-id].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
```

### Comandos de Prisma

Si realizas cambios en el esquema (`prisma/schema.prisma`), recuerda usar:
```bash
# Para actualizar la nube directamente (entorno de desarrollo cerrado)
npx prisma db push
```

---
*Documentación autogenerada y mantenida para el ecosistema Antigravity.*
