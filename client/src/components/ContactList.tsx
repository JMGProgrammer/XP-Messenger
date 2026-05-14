import { useMemo, useState } from "react";
import { useContactsStore } from "@/store/contactsStore";
import type { Contact, UserStatus } from "@/types";
import ContactItem from "./ContactItem";

const GROUPS: { status: UserStatus; label: string }[] = [
  { status: "online", label: "En línea" },
  { status: "away", label: "Ausente" },
  { status: "busy", label: "Ocupado" },
  { status: "offline", label: "Sin conexión" },
];

export default function ContactList() {
  const contacts = useContactsStore((s) => s.contacts);
  const loading = useContactsStore((s) => s.loading);
  const error = useContactsStore((s) => s.error);

  // Estado de colapso por grupo (offline arranca colapsado, los demás abiertos)
  const [collapsed, setCollapsed] = useState<Record<UserStatus, boolean>>({
    online: false,
    away: false,
    busy: false,
    offline: true,
  });

  function toggle(status: UserStatus) {
    setCollapsed((c) => ({ ...c, [status]: !c[status] }));
  }

  // Agrupar
  const grouped = useMemo(() => {
    const map: Record<UserStatus, Contact[]> = {
      online: [],
      away: [],
      busy: [],
      offline: [],
    };
    for (const c of contacts) map[c.status].push(c);
    // Orden alfabético dentro de cada grupo
    for (const k of Object.keys(map) as UserStatus[]) {
      map[k].sort((a, b) => a.displayName.localeCompare(b.displayName));
    }
    return map;
  }, [contacts]);

  if (loading) {
    return (
      <div className="p-3 text-[11px] text-gray-600">Cargando contactos...</div>
    );
  }

  if (error) {
    return (
      <div className="p-3 text-[11px] text-red-700 bg-red-50">
        Error: {error}
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="p-4 text-[11px] text-gray-600 text-center italic">
        No tenés contactos todavía.
        <br />
        Agregá uno con el botón "+ Agregar contacto" de abajo.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      {GROUPS.map(({ status, label }) => {
        const list = grouped[status];
        if (list.length === 0) return null;
        const isCollapsed = collapsed[status];

        return (
          <div key={status}>
            <button
              onClick={() => toggle(status)}
              className="w-full flex items-center gap-1 px-2 py-1 text-left text-[11px] font-bold text-msn-blue-dark bg-msn-bg hover:bg-msn-blue-pale border-b border-msn-border"
            >
              <span className="text-[9px]">{isCollapsed ? "▶" : "▼"}</span>
              <span>
                {label} ({list.length})
              </span>
            </button>
            {!isCollapsed && (
              <div className="py-1">
                {list.map((c) => (
                  <ContactItem key={c.id} contact={c} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
