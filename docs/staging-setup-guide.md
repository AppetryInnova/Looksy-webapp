# 🛠️ Guía de Configuración del Entorno de Staging: Looksy

Esta guía detalla los pasos para configurar, migrar y ejecutar el entorno de pruebas (**Staging**) de Looksy, permitiendo ensayar nuevas características de IA, VTO, y pasarelas de pago de forma completamente aislada de la base de datos de producción.

---

## 1. Arquitectura de Aislamiento
Para evitar el costo de mantener un clúster de base de datos Postgres secundario en Supabase, implementamos **esquemas aislados (PostgreSQL Schemas)** dentro de la misma base de datos.
*   **Producción**: Utiliza el esquema por defecto `public`.
*   **Staging**: Utiliza el esquema dedicado `staging`.

---

## 2. Configuración de Variables de Entorno
Hemos creado el archivo `.env.staging` en la raíz del proyecto. Este archivo contiene los connection strings con el parámetro `schema=staging`, lo que fuerza a Prisma y a Supabase a escribir y leer únicamente de dicho esquema.

### Configuración en `.env.staging`:
```ini
DATABASE_URL="postgresql://postgres.hnxpercbdncbzhldvzkm:[PASSWORD]@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=staging"
DIRECT_URL="postgresql://postgres.hnxpercbdncbzhldvzkm:[PASSWORD]@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?schema=staging"
```

---

## 3. Preparación y Migración de Base de Datos (Prisma)
Antes de ejecutar el entorno de Staging, debes subir la estructura de base de datos actual al nuevo esquema `staging`.

### En Windows (PowerShell):
Ejecuta el siguiente bloque para cargar temporalmente las variables de staging y sincronizar el esquema:
```powershell
# 1. Cargar las variables de entorno de staging en la sesión
$env:DATABASE_URL="postgresql://postgres.hnxpercbdncbzhldvzkm:mL0mJ0v91yEMXfLD@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=staging"
$env:DIRECT_URL="postgresql://postgres.hnxpercbdncbzhldvzkm:mL0mJ0v91yEMXfLD@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?schema=staging"

# 2. Empujar el esquema de Prisma al esquema 'staging'
npx prisma db push
```

### Usando dotenv-cli (Multiplataforma):
Si tienes instalado `dotenv-cli`, puedes ejecutarlo directamente sin definir variables en la sesión:
```bash
npx dotenv -e .env.staging prisma db push
```

---

## 4. Ejecución del Servidor Next.js en Modo Staging

Para probar localmente el flujo de Staging, puedes inicializar Next.js forzando el archivo de entorno `.env.staging`:

### Método 1: Usando dotenv-cli (Recomendado)
```bash
npx dotenv -e .env.staging next dev
```

### Método 2: En PowerShell
```powershell
$env:DATABASE_URL="postgresql://postgres.hnxpercbdncbzhldvzkm:mL0mJ0v91yEMXfLD@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&schema=staging"
$env:DIRECT_URL="postgresql://postgres.hnxpercbdncbzhldvzkm:mL0mJ0v91yEMXfLD@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?schema=staging"
npm run dev
```

---

## 5. Despliegue de Staging en Coolify o Vercel

### En Vercel:
1. Crea un proyecto secundario en tu dashboard de Vercel llamado `looksy-staging`.
2. Vincula la rama `staging` o `develop` de tu repositorio de Git.
3. Copia todas las variables de tu archivo `.env.staging` local y agrégalas en la sección **Environment Variables** de la configuración del proyecto en Vercel.

### En Coolify (VPS Privado):
1. Crea una nueva aplicación Next.js en tu panel de Coolify.
2. Define la rama de origen como `staging`.
3. Pega los valores de `.env.staging` en la pestaña de variables de entorno de tu aplicación en Coolify.
4. Despliega la aplicación. Coolify reconstruirá de manera automática el bundle de producción leyendo el esquema de base de datos de Staging.
