import { useEffect, useRef } from "react";
import type { Contact } from "@/types";

interface Props {
  contact: Contact;
  x: number;
  y: number;
  onClose: () => void;
  onOpenChat: () => void;
  onRemove: () => void;
}

export default function ContactContextMenu({
  contact,
  x,
  y,
  onClose,
  onOpenChat,
  onRemove,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Cerrar al click fuera o escape
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-[300] bg-white border border-gray-500 shadow-lg text-[11px] min-w-[160px]"
      style={{ left: x, top: y }}
    >
      <div className="px-2 py-1 bg-msn-blue-pale text-msn-blue-dark font-bold border-b border-gray-300 truncate">
        {contact.displayName}
      </div>
      <button
        onClick={() => {
          onOpenChat();
          onClose();
        }}
        className="w-full text-left px-3 py-1 hover:bg-msn-hover"
      >
        💬 Abrir conversación
      </button>
      <div className="border-t border-gray-300 my-1" />
      <button
        onClick={() => {
          onRemove();
          onClose();
        }}
        className="w-full text-left px-3 py-1 hover:bg-red-100 text-red-700"
      >
        🗑 Eliminar contacto
      </button>
    </div>
  );
}
