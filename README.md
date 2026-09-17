# NexVitria

NexVitria es un proyecto formativo de desarrollo de software que reúne la línea base técnica de una aplicación web con autenticación, perfiles de usuario y gestión de categorías y productos.

El repositorio separa una API backend, una aplicación frontend y las migraciones SQL usadas para definir la estructura de datos en Supabase.

## Estado del proyecto

El proyecto cuenta actualmente con una línea base técnica versionada que incluye:

- una API en Node.js y Express;
- una interfaz inicial en React y Vite;
- migraciones SQL para perfiles, roles, categorías y productos en Supabase.

Esta línea base permite continuar el desarrollo de forma organizada. La presencia de código relacionado con una funcionalidad no significa que sus historias de usuario estén terminadas, probadas o aceptadas. El repositorio tampoco contiene todavía automatizaciones de CI/CD ni scripts de pruebas automatizadas.

## Tecnologías

Las versiones indicadas corresponden a las dependencias resueltas actualmente en los archivos `package-lock.json`.

### Backend

| Tecnología | Versión | Uso actual |
| --- | ---: | --- |
| Node.js | No fijada en el repositorio | Entorno de ejecución del backend |
| Express | 5.2.1 | API HTTP y enrutamiento |
| `@supabase/supabase-js` | 2.112.3 | Acceso a Supabase y validación de usuarios |
| Helmet | 8.3.0 | Encabezados HTTP de seguridad |
| CORS | 2.8.6 | Control de orígenes permitidos |
| `express-rate-limit` | 8.6.2 | Límites para registro e inicio de sesión |
| dotenv | 17.4.2 | Carga de variables de entorno |
| Nodemon | 3.1.14 | Reinicio del servidor durante desarrollo |

### Frontend

| Tecnología | Versión | Uso actual |
| --- | ---: | --- |
| React | 19.2.8 | Construcción de la interfaz |
| React DOM | 19.2.8 | Renderizado de la aplicación |
| Vite | 8.2.1 | Servidor de desarrollo y build |
| ESLint | 10.8.1 | Análisis estático del código |
| `@vitejs/plugin-react` | 6.0.5 | Integración de React con Vite |

### Base de datos y servicios

- **Supabase Auth** para autenticación y usuarios.
- **PostgreSQL mediante Supabase** para perfiles, categorías y productos.
- **Row Level Security (RLS)** y permisos SQL definidos en las migraciones versionadas.

El repositorio no fija una versión concreta de PostgreSQL o de la plataforma Supabase.

## Arquitectura general

La estructura actual separa tres áreas:

- **Frontend:** aplicación React construida con Vite. La interfaz actual corresponde a la base inicial del frontend.
- **Backend:** API Express organizada en configuración, rutas, controladores, servicios y middlewares. Contiene módulos para autenticación, categorías y productos.
- **Supabase:** servicios de autenticación y persistencia, con el esquema de base de datos representado mediante migraciones SQL.

El backend monta rutas bajo `/api/auth`, `/api/categorias` y `/api/productos`. La configuración actual también expone una respuesta básica en `/` y permite el origen local `http://localhost:5173` mediante CORS.

## Estructura del repositorio

```text
NexVitria/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   └── services/
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── public/
│   ├── src/
│   ├── eslint.config.js
│   ├── vite.config.js
│   ├── package.json
│   └── package-lock.json
├── supabase/
│   └── migrations/
├── .gitignore
└── README.md
```

Los directorios generados, como `node_modules/`, `dist/`, `build/` y `out/`, no forman parte del código versionado.

## Requisitos previos

Para trabajar localmente se requiere:

- Git;
- Node.js;
- npm;
- acceso a un proyecto Supabase para usar las funciones que dependen de autenticación o persistencia.

El repositorio no declara una versión mínima de Node.js mediante `engines`, `.nvmrc` o `.node-version`. Se debe usar una versión compatible con las dependencias registradas en los lockfiles.

## Obtener el repositorio

```bash
git clone https://github.com/JuanEstebanLT/NexVitria.git
cd NexVitria
```

## Configuración del backend

El archivo [`backend/.env.example`](backend/.env.example) documenta las variables requeridas. Para preparar una configuración local, copia ese archivo como `backend/.env` y completa los valores en tu entorno.

En PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
```

En una terminal compatible con POSIX:

```bash
cp backend/.env.example backend/.env
```

Variables declaradas:

| Variable | Propósito |
| --- | --- |
| `NODE_ENV` | Controla el comportamiento dependiente del entorno, como el detalle de errores en desarrollo |
| `PORT` | Puerto de escucha del servidor; el código usa `3000` cuando no se define |
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_PUBLISHABLE_KEY` | Clave publicable usada para operaciones de autenticación |
| `SUPABASE_SECRET_KEY` | Clave confidencial usada exclusivamente por el backend para operaciones privilegiadas |

No se debe versionar `backend/.env`. La clave indicada por `SUPABASE_SECRET_KEY` debe permanecer únicamente en entornos seguros del servidor y nunca incorporarse al frontend.

## Instalación y ejecución del backend

Instala exactamente las dependencias registradas en el lockfile:

```bash
cd backend
npm ci
```

Para desarrollo con reinicio automático:

```bash
npm run dev
```

Para iniciar el servidor con Node.js:

```bash
npm start
```

Scripts disponibles en [`backend/package.json`](backend/package.json):

| Script | Comando ejecutado |
| --- | --- |
| `npm run dev` | `nodemon src/server.js` |
| `npm start` | `node src/server.js` |

Actualmente el backend no declara scripts de build, lint o pruebas.

## Instalación y ejecución del frontend

```bash
cd frontend
npm ci
npm run dev
```

Scripts disponibles en [`frontend/package.json`](frontend/package.json):

| Script | Propósito |
| --- | --- |
| `npm run dev` | Inicia el servidor de desarrollo de Vite |
| `npm run build` | Genera el build del frontend en `dist/` |
| `npm run lint` | Ejecuta ESLint sobre el proyecto |
| `npm run preview` | Sirve localmente el build generado por Vite |

El frontend no utiliza actualmente variables `import.meta.env` ni declara un script de pruebas.

## Supabase y migraciones

Las migraciones versionadas representan la línea base SQL y no se ejecutan automáticamente al instalar el backend o el frontend:

1. [`001_create_profiles.sql`](supabase/migrations/001_create_profiles.sql) crea el tipo de rol, la tabla de perfiles, RLS, una política de lectura del perfil propio y el trigger que crea un perfil al registrar un usuario.
2. [`002_create_categories_products.sql`](supabase/migrations/002_create_categories_products.sql) crea categorías y productos, sus restricciones e índices, los triggers de actualización de fechas, RLS y permisos para el rol de servicio.
3. [`003_grant_profiles_backend.sql`](supabase/migrations/003_grant_profiles_backend.sql) concede al rol de servicio permiso de lectura sobre perfiles.

La aplicación de estas migraciones debe tratarse como una operación controlada y revisarse antes de actuar sobre cualquier base de datos. El repositorio no incluye una configuración local de Supabase (`config.toml`).

## Flujo de trabajo Git y GitHub

El repositorio usa `main` como rama protegida y admite únicamente Squash Merge. El flujo de trabajo establecido es:

```text
Issue → rama vinculada → análisis → cambios → validación
      → staging selectivo → commit → push → Pull Request
      → revisión manual → Squash Merge → main
```

Cada cambio debe desarrollarse en una rama asociada a su Issue. No se realizan commits ni pushes directos a `main`, y el staging debe limitarse a los archivos del alcance de la tarea.

## Consideraciones de seguridad

- Los archivos `.env` y sus variantes sensibles están excluidos por `.gitignore`; `.env.example` sí puede versionarse porque documenta nombres y valores de ejemplo.
- `node_modules/`, builds, logs, cobertura, archivos de editor y datos temporales de Supabase están excluidos.
- Las credenciales privilegiadas de Supabase pertenecen al backend y no deben exponerse en código cliente, documentación, commits o Pull Requests.
- Las migraciones SQL deben revisarse y aplicarse mediante una tarea controlada; clonarlas no modifica ninguna base de datos.

## Alcance de la línea base

Este README describe el estado técnico versionado del repositorio. No certifica que el sistema esté listo para producción ni que las funcionalidades visibles estén completas o aceptadas. Las nuevas capacidades, correcciones, pruebas, automatizaciones y cambios de base de datos deben gestionarse mediante Issues y Pull Requests independientes.
