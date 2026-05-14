import { useEffect, useState } from "react";
import { Rnd } from "react-rnd";
import UserHeader from "./UserHeader";
import ContactList from "./ContactList";
import AddContactModal from "./AddContactModal";
import { useAuthStore } from "@/store/authStore";
import { useContactsStore } from "@/store/contactsStore";

export default function MainWindow() {
  const logout = useAuthStore((s) => s.logout);
  const fetchContacts = useContactsStore((s) => s.fetchContacts);
  const attachListeners = useContactsStore((s) => s.attachSocketListeners);
  const detachListeners = useContactsStore((s) => s.detachSocketListeners);

  const [showAddModal, setShowAddModal] = useState(false);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    fetchContacts();
    attachListeners();
    return () => detachListeners();
  }, [fetchContacts, attachListeners, detachListeners]);

  return (
    <>
      <Rnd
        default={{
          x: 20,
          y: 20,
          width: 280,
          height: minimized ? 28 : 480,
        }}
        size={{
          width: 280,
          height: minimized ? 28 : 480,
        }}
        enableResizing={false}
        dragHandleClassName="msn-titlebar"
        bounds="parent"
        style={{ zIndex: 50 }}
      >
        <div className="msn-window h-full flex flex-col">
          {/* Title bar */}
          <div className="msn-titlebar">
            <span>XP Messenger</span>
            <div className="msn-titlebar-buttons">
              <button
                className="msn-titlebar-button"
                onClick={() => setMinimized(!minimized)}
                title={minimized ? "Restaurar" : "Minimizar"}
              >
                _
              </button>
              <button
                className="msn-titlebar-button close"
                onClick={logout}
                title="Cerrar sesión"
              >
                ×
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              <UserHeader />

              {/* Toolbar con acción de agregar */}
              <div className="px-2 py-1 bg-msn-bg-alt border-b border-msn-border flex items-center justify-between">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="text-[10px] text-msn-blue-dark hover:underline"
                >
                  + Agregar contacto
                </button>
              </div>

              <ContactList />
            </>
          )}
        </div>
      </Rnd>

      {showAddModal && (
        <AddContactModal onClose={() => setShowAddModal(false)} />
      )}
    </>
  );
}
