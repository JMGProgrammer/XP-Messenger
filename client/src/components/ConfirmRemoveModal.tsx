import { useState } from "react";
import type { Contact } from "@/types";
import { useContactsStore } from "@/store/contactsStore";

interface Props {
  contact: Contact;
  onClose: () => void;
}

export default function ConfirmRemoveModal({ contact, onClose }: Props) {
  const removeContact = useContactsStore((s) => s.removeContact);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setSubmitting(true);
    setError(null);
    try {
      await removeContact(contact.id);
      onClose();
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="msn-window w-[340px]">
        <div className="msn-titlebar">
          <span>Eliminar contacto</span>
          <div className="msn-titlebar-buttons">
            <button
              type="button"
              className="msn-titlebar-button close"
              onClick={onClose}
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-4 bg-msn-bg flex flex-col gap-3">
          <p className="text-[11px] text-gray-800">
            ¿Estás seguro de que querés eliminar a{" "}
            <span className="font-bold text-msn-blue-dark">
              {contact.displayName}
            </span>{" "}
            de tu lista de contactos?
          </p>
          <p className="text-[10px] text-gray-600 italic">
            El historial de mensajes se mantiene, pero no podrán escribirse
            hasta que se agreguen mutuamente otra vez.
          </p>

          {error && (
            <div className="text-[11px] text-red-700 bg-red-50 border border-red-300 px-2 py-1">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-1 text-[11px] bg-gradient-to-b from-white to-gray-200 border border-gray-500 hover:brightness-95 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting}
              className="px-4 py-1 text-[11px] bg-gradient-to-b from-red-200 to-red-400 border border-red-700 hover:brightness-110 disabled:opacity-50"
            >
              {submitting ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
