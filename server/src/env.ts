import "dotenv/config";

function required(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}

/**
 * CLIENT_ORIGIN puede ser una URL única o una lista separada por comas.
 * Ej: "http://localhost:5173,https://xp-messenger.vercel.app"
 */
function parseOrigins(value: string | undefined): string[] {
  if (!value) return ["http://localhost:5173"];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET: required("JWT_SECRET"),
  PORT: Number(process.env.PORT ?? 4000),
  CLIENT_ORIGINS: parseOrigins(process.env.CLIENT_ORIGIN),
  NODE_ENV: process.env.NODE_ENV ?? "development",
};
