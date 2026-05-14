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

app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));

// API routes
app.use("/auth", authRouter);
app.use("/contacts", contactsRouter);
app.use("/messages", messagesRouter);

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: env.CLIENT_ORIGIN, credentials: true },
});

registerSocketHandlers(io);

httpServer.listen(env.PORT, () => {
  console.log(`🟢 Server running on http://localhost:${env.PORT}`);
  console.log(`   CORS allowed origin: ${env.CLIENT_ORIGIN}`);
});
