import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import StatusSelector from "./StatusSelector";

export default function UserHeader() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [editingMessage, setEditingMessage] = useState(false);
  const [messageDraft, setMessageDraft] = useState(user?.personalMessage ?? "");

  if (!user) return null;

  function saveMessage() {
    // En esta fase solo se actualiza local; la persistencia en DB se puede
    // agregar en una fase posterior (endpoint PATCH /auth/me).
    updateUser({ personalMessage: messageDraft });
    setEditingMessage(false);
  }

  return (
    <div className="px-3 py-2 bg-gradient-to-b from-msn-blue-pale to-white border-b border-msn-border">
      <div className="flex items-start gap-3">
        {/* Avatar circular */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-msn-blue-light to-msn-blue-dark flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-sm">
          {user.displayName.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-bold text-msn-blue-dark text-[12px] truncate">
              {user.displayName}
            </span>
          </div>

          <StatusSelector />

          {/* Mensaje personal editable */}
          <div className="mt-1">
            {editingMessage ? (
              <input
                autoFocus
                type="text"
                value={messageDraft}
                onChange={(e) => setMessageDraft(e.target.value)}
                onBlur={saveMessage}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveMessage();
                  if (e.key === "Escape") {
                    setMessageDraft(user.personalMessage);
                    setEditingMessage(false);
                  }
                }}
                maxLength={80}
                placeholder="Escribí un mensaje personal..."
                className="w-full text-[10px] italic text-gray-700 px-1 py-0.5 border border-msn-border bg-white"
              />
            ) : (
              <button
                onClick={() => {
                  setMessageDraft(user.personalMessage);
                  setEditingMessage(true);
                }}
                className="text-[10px] italic text-gray-600 hover:text-msn-blue-dark text-left truncate w-full"
                title="Click para editar"
              >
                {user.personalMessage || "<Escribí un mensaje personal>"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
