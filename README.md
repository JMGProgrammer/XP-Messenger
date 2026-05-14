# XP-Messenger

Clon de MSN Messenger (estética Windows XP) — Monorepo con frontend en Vite + React y backend Node.js + Socket.IO.

## 📂 Estructura

```
XP-Messenger/
├── client/        # Frontend (Vite + React + TS + Tailwind + Zustand)
└── server/        # Backend (Node + Express + Socket.IO + Prisma)
```

## 🚀 Setup paso a paso

### 1. Instalar dependencias (desde la raíz)

```bash
npm install
```

Esto instala todo (root + client + server) gracias a npm workspaces.

### 2. Configurar el backend

```bash
cd server
cp .env.example .env
```

Editá `server/.env` con tus credenciales reales de Supabase:

```
DATABASE_URL="postgresql://postgres.xxxxx:[PASSWORD]@aws-0-xxx.pooler.supabase.com:6543/postgres?pgbouncer=true"
JWT_SECRET="poné-un-string-largo-y-aleatorio-de-al-menos-32-caracteres"
PORT=4000
CLIENT_ORIGIN="http://localhost:5173"
```

> 💡 **Sobre la DATABASE_URL de Supabase:** usá la URL del _Connection Pooler_ (puerto 6543) con `?pgbouncer=true` al final. La encontrás en Supabase Dashboard → Project Settings → Database → Connection string → "Transaction" mode.

### 3. Crear las tablas en la base de datos

Desde `server/`:

```bash
npx prisma migrate dev --name init
```

Esto crea las tablas `User`, `Contact` y `Message` en Supabase.

### 4. (Opcional) Cargar usuarios de prueba

```bash
npx tsx prisma/seed.ts
```

Esto crea 3 usuarios de prueba (todos con password `password123`):

- `alice@test.com`
- `bob@test.com`
- `carol@test.com`

Ya quedan agregados como contactos entre sí.

### 5. Levantar todo

Desde la raíz:

```bash
npm run dev
```

Esto levanta:

- Backend en `http://localhost:4000`
- Frontend en `http://localhost:5173`

## 🛠️ Scripts útiles

- `npm run dev` — Levanta cliente + servidor en paralelo
- `npm run dev:client` — Solo el frontend
- `npm run dev:server` — Solo el backend
- `npx prisma studio` (desde `server/`) — UI para ver/editar la DB

## 📡 Eventos de Socket.IO

| Evento                     | Dirección       | Payload                             |
| -------------------------- | --------------- | ----------------------------------- |
| `message:send`             | client → server | `{ toUserId, content }`             |
| `message:receive`          | server → client | `Message`                           |
| `message:sent`             | server → client | `Message` (confirmación)            |
| `typing`                   | bidireccional   | `{ toUserId/fromUserId, isTyping }` |
| `status:change`            | client → server | `{ status }`                        |
| `contact:status`           | server → client | `{ userId, status }`                |
| `contacts:initialStatuses` | server → client | `Array<{userId, status}>`           |
