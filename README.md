Portal de la **Copa México VALORANT 2026** — Next.js 16 (App Router) + Postgres.

## Configuración de base de datos y autenticación

La app usa **Postgres** (Neon / Supabase / Vercel Postgres) con el driver `postgres.js`
y autenticación propia (hash `scrypt` + cookie de sesión firmada con HMAC).

1. **Crea una base Postgres** en [Neon](https://neon.tech) o [Supabase](https://supabase.com) (plan gratis).
2. **Copia `.env.example` a `.env.local`** y rellena:
   - `DATABASE_URL` — cadena de conexión (incluye `?sslmode=require`).
   - `AUTH_SECRET` — genera uno con:
     `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`
3. **Crea las tablas y datos de prueba:**
   ```bash
   npm run db:setup
   ```
   Esto imprime credenciales de prueba, por ejemplo:
   - **Comité (CO):** usuario `comite` · contraseña `admin1234`
   - **Equipo:** `Jaguares#JAG` · contraseña `jaguares123`
   - **Equipo:** `Quetzal#QTZ` · contraseña `quetzal123`

### Rutas de la app
- `/ingresar` — login de equipo (NOMBRE#TAG) o del Comité.
- `/equipo` — panel del equipo: flujo de inscripción + editor de roster (protegido).
- `/admin` — panel del Comité Organizador (protegido, solo rol CO).

> El esquema vive en [`db/schema.sql`](db/schema.sql) y el seed en
> [`scripts/db-setup.mjs`](scripts/db-setup.mjs). El script es idempotente.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
