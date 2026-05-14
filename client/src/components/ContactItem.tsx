import type { Contact } from "@/types";
import StatusIcon from "./StatusIcon";
import { useChatStore } from "@/store/chatStore";

interface Props {
  contact: Contact;
}

export default function ContactItem({ contact }: Props) {
  const openChat = useChatStore((s) => s.openChat);
  const offline = contact.status === "offline";

  return (
    <button
      onDoubleClick={() => openChat(contact)}
      className={[
        "w-full flex items-center gap-2 px-2 py-1 text-left",
        "hover:bg-msn-hover transition-colors",
        offline ? "opacity-60" : "",
      ].join(" ")}
      title="Doble click para abrir conversación"
    >
      <StatusIcon status={contact.status} size={14} />
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-black truncate leading-tight">
          {contact.displayName}
        </div>
        {contact.personalMessage && (
          <div className="text-[10px] italic text-gray-500 truncate leading-tight">
            {contact.personalMessage}
          </div>
        )}
      </div>
    </button>
  );
}
