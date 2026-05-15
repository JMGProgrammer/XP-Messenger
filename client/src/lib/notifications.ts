/**
 * Helper para notificaciones nativas del navegador.
 * Solicita permiso la primera vez y reutiliza el permiso después.
 */

let permissionRequested = false;

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  if (permissionRequested) return false;

  permissionRequested = true;
  try {
    const result = await Notification.requestPermission();
    return result === "granted";
  } catch {
    return false;
  }
}

interface ShowNotificationOptions {
  title: string;
  body: string;
  /** Si el usuario ya está mirando la pestaña, no mostrar notificación */
  skipIfFocused?: boolean;
  /** Click handler: ejecuta esto cuando el user hace click en la noti */
  onClick?: () => void;
}

export function showNotification({
  title,
  body,
  skipIfFocused = true,
  onClick,
}: ShowNotificationOptions) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (skipIfFocused && document.hasFocus()) return;

  try {
    const notif = new Notification(title, {
      body,
      icon: "/favicon.svg", // si no existe, el browser usa su default
      tag: "xp-messenger", // notificaciones con el mismo tag se reemplazan
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
      onClick?.();
    };

    // Auto-cerrar después de 5 segundos
    setTimeout(() => notif.close(), 5000);
  } catch {
    // ignore
  }
}
