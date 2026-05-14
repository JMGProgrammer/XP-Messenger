import { FormEvent, useState } from "react";
import { useContactsStore } from "@/store/contactsStore";

interface Props {
  onClose: () => void;
}

export default function AddContactModal({ onClose }: Props) {
  const addContact = useContactsStore((s) => s.addContact);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await addContact(email);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="msn-window w-[340px]">
        <div className="msn-titlebar">
          <span>Agregar contacto</span>
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

        <form
          onSubmit={handleSubmit}
          className="p-4 bg-msn-bg flex flex-col gap-3"
        >
          <p className="text-[11px] text-gray-700">
            Ingresá el correo electrónico del contacto que querés agregar:
          </p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ejemplo@dominio.com"
            required
            autoFocus
            className="w-full px-2 py-1 border border-gray-500 bg-white text-[11px] focus:outline-none focus:border-msn-blue-dark"
          />

          {error && (
            <div className="text-[11px] text-red-700 bg-red-50 border border-red-300 px-2 py-1">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1 text-[11px] bg-gradient-to-b from-white to-gray-200 border border-gray-500 hover:brightness-95"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1 text-[11px] bg-gradient-to-b from-msn-blue-pale to-msn-blue-light border border-msn-blue-dark hover:brightness-110 disabled:opacity-50"
            >
              {submitting ? "Agregando..." : "Agregar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
