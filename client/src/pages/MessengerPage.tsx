import { useAuthStore } from "@/store/authStore";

export default function MessengerPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="xp-desktop">
      {/* Ventana MSN placeholder - en Fase B la convertimos en la lista de contactos real */}
      <div className="msn-window absolute top-10 left-10 w-[300px]">
        <div className="msn-titlebar">
          <span>XP Messenger</span>
          <div className="msn-titlebar-buttons">
            <button className="msn-titlebar-button" tabIndex={-1}>
              _
            </button>
            <button className="msn-titlebar-button close" onClick={logout}>
              ×
            </button>
          </div>
        </div>
        <div className="p-4 bg-msn-bg flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-msn-blue-light to-msn-blue-dark flex items-center justify-center text-white font-bold text-xl">
              {user?.displayName.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div className="flex-1">
              <div className="font-bold text-msn-blue-dark text-[12px]">
                {user?.displayName}
              </div>
              <div className="text-[10px] text-gray-600">{user?.email}</div>
            </div>
          </div>
          <div className="text-[10px] text-gray-700 bg-white border border-gray-300 p-2">
            ✅ Logueado correctamente. <br />
            <span className="text-msn-blue-dark">
              En la <b>Fase B</b> aparece acá la lista de contactos en tiempo
              real.
            </span>
          </div>
        </div>
      </div>

      {/* Taskbar XP */}
      <div className="xp-taskbar">
        <div className="xp-start-button">start</div>
        <div className="xp-taskbar-clock">
          {new Date().toLocaleTimeString("es-AR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
