import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { env } from "./env.js";
import { authRouter } from "./auth/routes.js";
import { contactsRouter } from "./routes/contacts.js";
import { messagesRouter } from "./routes/messages.js";
import { registerSocketHandlers } from "./sockets/index.js";

const app = express();

// Confiar en el proxy (necesario detrás de Railway/Vercel/etc.)
app.set("trust proxy", 1);

// CORS: acepta múltiples orígenes (dev + producción)
const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    // Permitir requests sin Origin (ej. curl, healthchecks de Railway)
    if (!origin) return callback(null, true);
    if (env.CLIENT_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: origin not allowed: ${origin}`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check (Railway lo usa para verificar que el server está vivo)
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
  });
});

// Root mínimo (para no devolver 404 al entrar a la URL base del backend)
app.get("/", (_req, res) => {
  res.json({ name: "XP Messenger API", status: "running" });
});

app.use("/auth", authRouter);
app.use("/contacts", contactsRouter);
app.use("/messages", messagesRouter);

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: corsOptions,
});

registerSocketHandlers(io);

httpServer.listen(env.PORT, () => {
  console.log(`🟢 Server running on port ${env.PORT} (${env.NODE_ENV})`);
  console.log(`   CORS allowed origins: ${env.CLIENT_ORIGINS.join(", ")}`);
});
