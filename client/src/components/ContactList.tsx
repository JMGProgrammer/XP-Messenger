import { useMemo, useState } from "react";
import { useContactsStore } from "@/store/contactsStore";
import type { Contact, UserStatus } from "@/types";
import ContactItem from "./ContactItem";
import ContactContextMenu from "./ContactContextMenu";
import ConfirmRemoveModal from "./ConfirmRemoveModal";
import { useChatStore } from "@/store/chatStore";

const GROUPS: { status: UserStatus; label: string }[] = [
  { status: "online", label: "En línea" },
  { status: "away", label: "Ausente" },
  { status: "busy", label: "Ocupado" },
  { status: "offline", label: "Sin conexión" },
];

interface ContextMenuState {
  contact: Contact;
  x: number;
  y: number;
}

export default function ContactList() {
  const contacts = useContactsStore((s) => s.contacts);
  const loading = useContactsStore((s) => s.loading);
  const error = useContactsStore((s) => s.error);
  const openChat = useChatStore((s) => s.openChat);

  const [collapsed, setCollapsed] = useState<Record<UserStatus, boolean>>({
    online: false,
    away: false,
    busy: false,
    offline: true,
  });

  const [search, setSearch] = useState("");
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [contactToRemove, setContactToRemove] = useState<Contact | null>(null);

  function toggle(status: UserStatus) {
    setCollapsed((c) => ({ ...c, [status]: !c[status] }));
  }

  function handleContextMenu(e: React.MouseEvent, contact: Contact) {
    setContextMenu({ contact, x: e.clientX, y: e.clientY });
  }

  // Filtro + agrupación
  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? contacts.filter(
          (c) =>
            c.displayName.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            c.personalMessage.toLowerCase().includes(q),
        )
      : contacts;

    const map: Record<UserStatus, Contact[]> = {
      online: [],
      away: [],
      busy: [],
      offline: [],
    };
    for (const c of filtered) map[c.status].push(c);
    for (const k of Object.keys(map) as UserStatus[]) {
      map[k].sort((a, b) => a.displayName.localeCompare(b.displayName));
    }
    return map;
  }, [contacts, search]);

  const totalFiltered =
    grouped.online.length +
    grouped.away.length +
    grouped.busy.length +
    grouped.offline.length;

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

  return (
    <>
      {/* Buscador */}
      <div className="px-2 py-1 bg-msn-bg-alt border-b border-msn-border">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar contactos..."
          className="w-full px-2 py-1 text-[10px] border border-gray-400 bg-white focus:outline-none focus:border-msn-blue-dark"
        />
      </div>

      {contacts.length === 0 ? (
        <div className="p-4 text-[11px] text-gray-600 text-center italic">
          No tenés contactos todavía.
          <br />
          Agregá uno con el botón "+ Agregar contacto".
        </div>
      ) : totalFiltered === 0 ? (
        <div className="p-4 text-[11px] text-gray-600 text-center italic">
          Ningún contacto coincide con "{search}".
        </div>
      ) : (
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
                      <ContactItem
                        key={c.id}
                        contact={c}
                        onContextMenu={handleContextMenu}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Menú contextual */}
      {contextMenu && (
        <ContactContextMenu
          contact={contextMenu.contact}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onOpenChat={() => openChat(contextMenu.contact)}
          onRemove={() => setContactToRemove(contextMenu.contact)}
        />
      )}

      {/* Confirmación de eliminar */}
      {contactToRemove && (
        <ConfirmRemoveModal
          contact={contactToRemove}
          onClose={() => setContactToRemove(null)}
        />
      )}
    </>
  );
}
