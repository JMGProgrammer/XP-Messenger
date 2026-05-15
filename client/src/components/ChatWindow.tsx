import {
  FormEvent,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Rnd } from "react-rnd";
import type { Contact, Message } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useContactsStore } from "@/store/contactsStore";
import { useMessagesStore } from "@/store/messagesStore";
import { useNudgeStore } from "@/store/nudgeStore";
import MessageBubble from "./MessageBubble";
import StatusIcon from "./StatusIcon";
import EmoticonPicker from "./EmoticonPicker";

interface Props {
  contact: Contact;
  initialX: number;
  initialY: number;
}

const EMPTY_MESSAGES: Message[] = [];
const SHAKE_DURATION_MS = 1200;

export default function ChatWindow({ contact, initialX, initialY }: Props) {
  const user = useAuthStore((s) => s.user);
  const closeChat = useChatStore((s) => s.closeChat);

  const liveStatus = useContactsStore(
    (s) =>
      s.contacts.find((c) => c.id === contact.id)?.status ?? contact.status,
  );
  const liveDisplayName = useContactsStore(
    (s) =>
      s.contacts.find((c) => c.id === contact.id)?.displayName ??
      contact.displayName,
  );
  const livePersonalMessage = useContactsStore(
    (s) =>
      s.contacts.find((c) => c.id === contact.id)?.personalMessage ??
      contact.personalMessage,
  );

  const messagesRef = useMessagesStore((s) => s.messagesByContact[contact.id]);
  const messages = useMemo(() => messagesRef ?? EMPTY_MESSAGES, [messagesRef]);

  const isTyping = useMessagesStore(
    (s) => s.typingByContact[contact.id] ?? false,
  );
  const loadingHistory = useMessagesStore(
    (s) => s.loadingByContact[contact.id] ?? false,
  );

  const loadHistory = useMessagesStore((s) => s.loadHistory);
  const sendMessage = useMessagesStore((s) => s.sendMessage);
  const sendTyping = useMessagesStore((s) => s.sendTyping);

  const shakeTimestamp = useNudgeStore((s) => s.shakingByContact[contact.id]);
  const sendNudge = useNudgeStore((s) => s.sendNudge);
  const canSendNudge = useNudgeStore((s) => s.canSendNudge(contact.id));

  const [draft, setDraft] = useState("");
  const [shaking, setShaking] = useState(false);
  const [emoticonPickerOpen, setEmoticonPickerOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingSentRef = useRef(false);

  useEffect(() => {
    if (user) loadHistory(contact.id, user.id);
  }, [contact.id, user, loadHistory]);

  useEffect(() => {
    if (messages.length > 0) {
      useChatStore.getState().markAsRead(contact.id);
    }
  }, [messages.length, contact.id]);

  useLayoutEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isTyping]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!shakeTimestamp) return;
    setShaking(true);
    const t = setTimeout(() => setShaking(false), SHAKE_DURATION_MS);
    return () => clearTimeout(t);
  }, [shakeTimestamp]);

  useEffect(() => {
    return () => {
      if (isTypingSentRef.current) {
        sendTyping(contact.id, false);
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [contact.id, sendTyping]);

  function handleDraftChange(value: string) {
    setDraft(value);

    if (!isTypingSentRef.current && value.length > 0) {
      sendTyping(contact.id, true);
      isTypingSentRef.current = true;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingSentRef.current) {
        sendTyping(contact.id, false);
        isTypingSentRef.current = false;
      }
    }, 2500);

    if (value.length === 0 && isTypingSentRef.current) {
      sendTyping(contact.id, false);
      isTypingSentRef.current = false;
    }
  }

  function insertEmoticon(code: string) {
    const ta = inputRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? draft.length;
    const end = ta.selectionEnd ?? draft.length;
    const newText = draft.slice(0, start) + code + draft.slice(end);
    handleDraftChange(newText);
    // Restaurar cursor justo después del emoticón insertado
    setTimeout(() => {
      ta.focus();
      const pos = start + code.length;
      ta.setSelectionRange(pos, pos);
    }, 0);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    sendMessage(contact.id, draft);
    setDraft("");
    if (isTypingSentRef.current) {
      sendTyping(contact.id, false);
      isTypingSentRef.current = false;
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  }

  function handleNudge() {
    if (!canSendNudge) return;
    sendNudge(contact.id);
  }

  return (
    <Rnd
      default={{
        x: initialX,
        y: initialY,
        width: 420,
        height: 400,
      }}
      minWidth={300}
      minHeight={280}
      dragHandleClassName="chat-titlebar"
      bounds="parent"
      style={{ zIndex: 100 }}
    >
      <div
        className={`msn-window h-full flex flex-col ${shaking ? "msn-shaking" : ""}`}
      >
        <div className="msn-titlebar chat-titlebar">
          <span className="truncate">{liveDisplayName} - Conversación</span>
          <div className="msn-titlebar-buttons">
            <button
              className="msn-titlebar-button close"
              onClick={() => closeChat(contact.id)}
              title="Cerrar"
            >
              ×
            </button>
          </div>
        </div>

        <div className="px-3 py-2 bg-gradient-to-b from-msn-blue-pale to-white border-b border-msn-border flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-msn-blue-light to-msn-blue-dark flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {liveDisplayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <StatusIcon status={liveStatus} size={10} />
              <span className="font-bold text-[11px] text-msn-blue-dark truncate">
                {liveDisplayName}
              </span>
            </div>
            {livePersonalMessage && (
              <div className="text-[10px] italic text-gray-600 truncate">
                {livePersonalMessage}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 bg-white">
          {loadingHistory && (
            <div className="text-center text-[10px] text-gray-500 py-2">
              Cargando historial...
            </div>
          )}
          {!loadingHistory && messages.length === 0 && (
            <div className="text-center text-[10px] text-gray-500 italic py-4">
              Iniciá la conversación con {liveDisplayName} 👋
            </div>
          )}
          {messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              isMine={m.senderId === user?.id}
              senderName={
                m.senderId === user?.id
                  ? (user?.displayName ?? "Yo")
                  : liveDisplayName
              }
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="px-3 py-1 text-[10px] text-gray-600 italic bg-msn-bg-alt border-t border-msn-border h-5">
          {isTyping && `${liveDisplayName} está escribiendo...`}
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col bg-msn-bg p-2 gap-2 border-t border-msn-border relative"
        >
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => handleDraftChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribí un mensaje..."
            rows={2}
            maxLength={2000}
            className="w-full px-2 py-1 border border-gray-500 bg-white text-[11px] resize-none focus:outline-none focus:border-msn-blue-dark"
          />
          <div className="flex justify-between items-center gap-2 relative">
            {/* Botón de emoticones (con picker desplegable arriba) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setEmoticonPickerOpen(!emoticonPickerOpen)}
                title="Insertar emoticón"
                className="px-2 py-1 text-[12px] bg-gradient-to-b from-white to-gray-200 border border-gray-500 hover:brightness-95"
              >
                🙂
              </button>
              {emoticonPickerOpen && (
                <EmoticonPicker
                  onPick={insertEmoticon}
                  onClose={() => setEmoticonPickerOpen(false)}
                />
              )}
            </div>

            {/* Botón de zumbido */}
            <button
              type="button"
              onClick={handleNudge}
              disabled={!canSendNudge}
              title={
                canSendNudge
                  ? "Enviar zumbido"
                  : "Esperá unos segundos antes de enviar otro zumbido"
              }
              className="px-2 py-1 text-[10px] bg-gradient-to-b from-yellow-100 to-yellow-300 border border-yellow-700 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              ⚡ Zumbido
            </button>

            <span className="text-[9px] text-gray-500 flex-1 text-center">
              Enter envía · Shift+Enter salto
            </span>
            <button
              type="submit"
              disabled={!draft.trim()}
              className="px-4 py-1 text-[11px] bg-gradient-to-b from-msn-blue-pale to-msn-blue-light border border-msn-blue-dark hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Enviar
            </button>
          </div>
        </form>
      </div>
    </Rnd>
  );
}
