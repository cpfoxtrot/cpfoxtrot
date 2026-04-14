# Mi Proyecto

Next.js 14 + TypeScript + Supabase + Vercel.

## Primeros pasos

1. Copia el fichero de ejemplo de variables de entorno:
   ```bash
   cp .env.local.example .env.local
   ```
2. Rellena `.env.local` con tus claves de Supabase (Project Settings → API).

3. Instala dependencias y arranca:
   ```bash
   npm install
   npm run dev
   ```

Abre [http://localhost:3000](http://localhost:3000).

## Despliegue

Push a `main` → Vercel redespliega automáticamente.
