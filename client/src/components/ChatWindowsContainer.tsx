import { useEffect } from "react";
import { useChatStore } from "@/store/chatStore";
import { useMessagesStore } from "@/store/messagesStore";
import { useNudgeStore } from "@/store/nudgeStore";
import { useAuthStore } from "@/store/authStore";
import { getSocket } from "@/lib/socket";
import ChatWindow from "./ChatWindow";

export default function ChatWindowsContainer() {
  const openWindows = useChatStore((s) => s.openWindows);
  const user = useAuthStore((s) => s.user);

  const attachMessageListeners = useMessagesStore(
    (s) => s.attachSocketListeners,
  );
  const detachMessageListeners = useMessagesStore(
    (s) => s.detachSocketListeners,
  );

  const attachNudgeListeners = useNudgeStore((s) => s.attachSocketListeners);
  const detachNudgeListeners = useNudgeStore((s) => s.detachSocketListeners);

  useEffect(() => {
    if (!user) return;

    const attach = () => {
      attachMessageListeners(user.id);
      attachNudgeListeners();
    };

    const okMsg = attachMessageListeners(user.id);
    const okNudge = attachNudgeListeners();

    if (!okMsg || !okNudge) {
      const socket = getSocket();
      if (socket) {
        socket.on("connect", attach);
        return () => {
          socket.off("connect", attach);
          detachMessageListeners();
          detachNudgeListeners();
        };
      }
    }

    return () => {
      detachMessageListeners();
      detachNudgeListeners();
    };
  }, [
    user,
    attachMessageListeners,
    detachMessageListeners,
    attachNudgeListeners,
    detachNudgeListeners,
  ]);

  return (
    <>
      {openWindows.map((w) => (
        <ChatWindow
          key={w.contact.id}
          contact={w.contact}
          initialX={w.initialX}
          initialY={w.initialY}
        />
      ))}
    </>
  );
}
