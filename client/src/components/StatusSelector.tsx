import { useEffect, useRef, useState } from "react";
import type { UserStatus } from "@/types";
import StatusIcon from "./StatusIcon";
import { getSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";

const STATUSES: { value: Exclude<UserStatus, "offline">; label: string }[] = [
  { value: "online", label: "En línea" },
  { value: "away", label: "Ausente" },
  { value: "busy", label: "Ocupado" },
];

export default function StatusSelector() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const logout = useAuthStore((s) => s.logout);

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al click fuera
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", onClick);
      return () => document.removeEventListener("mousedown", onClick);
    }
  }, [open]);

  function changeStatus(status: Exclude<UserStatus, "offline">) {
    const socket = getSocket();
    socket?.emit("status:change", { status });
    updateUser({ status });
    setOpen(false);
  }

  function getLabel(status: UserStatus): string {
    return STATUSES.find((s) => s.value === status)?.label ?? "Sin conexión";
  }

  if (!user) return null;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-[10px] text-gray-700 hover:text-msn-blue-dark"
      >
        <StatusIcon status={user.status} size={10} />
        <span>{getLabel(user.status)}</span>
        <span className="text-[8px]">▼</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-500 shadow-md z-10 min-w-[120px]">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => changeStatus(s.value)}
              className="w-full flex items-center gap-2 px-2 py-1 text-[11px] text-left hover:bg-msn-hover"
            >
              <StatusIcon status={s.value} size={12} />
              <span>{s.label}</span>
            </button>
          ))}
          <div className="border-t border-gray-300 my-1" />
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-2 py-1 text-[11px] text-left hover:bg-msn-hover text-red-700"
          >
            <span>↪</span>
            <span>Cerrar sesión</span>
          </button>
        </div>
      )}
    </div>
  );
}
