import { useEffect, useState } from "react";
import MainWindow from "@/components/MainWindow";
import ChatWindowsContainer from "@/components/ChatWindowsContainer";
import ErrorToast from "@/components/ErrorToast";
import { requestNotificationPermission } from "@/lib/notifications";
import { useChatStore, getTotalUnread } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { getSocket } from "@/lib/socket";

const BASE_TITLE = "XP Messenger";

export default function MessengerPage() {
  const [time, setTime] = useState(() => new Date());

  const unreadMap = useChatStore((s) => s.unreadByContact);
  const attachStatusListener = useAuthStore((s) => s.attachStatusListener);

  // Reloj
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    const tryAttach = () => attachStatusListener();
    tryAttach();
    const socket = getSocket();
    if (socket) {
      socket.on("connect", tryAttach);
      return () => {
        socket.off("connect", tryAttach);
      };
    }
  }, [attachStatusListener]);

  useEffect(() => {
    const total = getTotalUnread(unreadMap);
    document.title = total > 0 ? `(${total}) ${BASE_TITLE}` : BASE_TITLE;
    return () => {
      document.title = BASE_TITLE;
    };
  }, [unreadMap]);

  return (
    <div className="xp-desktop">
      <MainWindow />
      <ChatWindowsContainer />
      <ErrorToast />

      <div className="xp-taskbar">
        <div className="xp-start-button">start</div>
        <div className="xp-taskbar-clock">
          {time.toLocaleTimeString("es-AR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
