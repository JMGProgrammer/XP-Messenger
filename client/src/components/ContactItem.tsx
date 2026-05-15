import type { Contact } from "@/types";
import StatusIcon from "./StatusIcon";
import { useChatStore } from "@/store/chatStore";

interface Props {
  contact: Contact;
  onContextMenu: (e: React.MouseEvent, contact: Contact) => void;
}

export default function ContactItem({ contact, onContextMenu }: Props) {
  const openChat = useChatStore((s) => s.openChat);
  const unread = useChatStore((s) => s.unreadByContact[contact.id] ?? 0);
  const offline = contact.status === "offline";

  return (
    <button
      onDoubleClick={() => openChat(contact)}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e, contact);
      }}
      className={[
        "w-full flex items-center gap-2 px-2 py-1 text-left",
        "hover:bg-msn-hover transition-colors",
        unread > 0 ? "bg-yellow-50" : "",
        offline ? "opacity-60" : "",
      ].join(" ")}
      title="Doble click para abrir conversación · Click derecho para más opciones"
    >
      <StatusIcon status={contact.status} size={14} />
      <div className="flex-1 min-w-0">
        <div
          className={`text-[11px] truncate leading-tight ${unread > 0 ? "font-bold text-black" : "text-black"}`}
        >
          {contact.displayName}
        </div>
        {contact.personalMessage && (
          <div className="text-[10px] italic text-gray-500 truncate leading-tight">
            {contact.personalMessage}
          </div>
        )}
      </div>
      {unread > 0 && (
        <div className="flex-shrink-0 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {unread > 99 ? "99+" : unread}
        </div>
      )}
    </button>
  );
}
