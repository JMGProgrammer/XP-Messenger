import { FormEvent, useState } from "react";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const loading = useAuthStore((s) => s.loading);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("alice@test.com");
  const [password, setPassword] = useState("password123");
  const [displayName, setDisplayName] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        if (!displayName.trim()) {
          setLocalError("Ingresá un nombre para mostrar");
          return;
        }
        await register(email, password, displayName);
      }
    } catch (err) {
      setLocalError((err as Error).message);
    }
  }

  return (
    <div className="xp-desktop flex items-center justify-center">
      <div className="msn-window w-[380px]">
        {/* Title bar */}
        <div className="msn-titlebar">
          <span>.NET Messenger Service</span>
          <div className="msn-titlebar-buttons">
            <button className="msn-titlebar-button" tabIndex={-1}>
              _
            </button>
            <button className="msn-titlebar-button close" tabIndex={-1}>
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center bg-msn-bg">
          {/* Logo MSN simulado */}
          <div className="my-4 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-msn-blue-light to-msn-blue-dark flex items-center justify-center shadow-md mb-2">
              <span className="text-white text-3xl font-bold">M</span>
            </div>
            <h1 className="text-msn-blue-dark text-lg font-bold tracking-tight">
              XP Messenger
            </h1>
            <p className="text-[10px] text-gray-600">
              {mode === "login" ? "Iniciá sesión" : "Creá tu cuenta"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2">
            <label className="text-[11px]">
              <span className="block mb-1">
                Dirección de correo electrónico:
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-2 py-1 border border-gray-500 bg-white text-[11px] focus:outline-none focus:border-msn-blue-dark"
              />
            </label>

            {mode === "register" && (
              <label className="text-[11px]">
                <span className="block mb-1">Nombre para mostrar:</span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  maxLength={40}
                  className="w-full px-2 py-1 border border-gray-500 bg-white text-[11px] focus:outline-none focus:border-msn-blue-dark"
                />
              </label>
            )}

            <label className="text-[11px]">
              <span className="block mb-1">Contraseña:</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-2 py-1 border border-gray-500 bg-white text-[11px] focus:outline-none focus:border-msn-blue-dark"
              />
            </label>

            {localError && (
              <div className="text-[11px] text-red-700 bg-red-50 border border-red-300 px-2 py-1">
                {localError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-3 self-end px-6 py-1 text-[11px] bg-gradient-to-b from-msn-blue-pale to-msn-blue-light border border-msn-blue-dark hover:brightness-110 active:brightness-95 disabled:opacity-50"
            >
              {loading
                ? "Conectando..."
                : mode === "login"
                  ? "Iniciar sesión"
                  : "Crear cuenta"}
            </button>
          </form>

          <button
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setLocalError(null);
            }}
            className="mt-4 text-[10px] text-msn-blue-dark hover:underline"
          >
            {mode === "login"
              ? "¿No tenés cuenta? Registrate"
              : "¿Ya tenés cuenta? Iniciar sesión"}
          </button>
        </div>
      </div>
    </div>
  );
}
