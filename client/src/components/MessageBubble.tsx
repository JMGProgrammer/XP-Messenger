import { useMemo } from "react";
import type { Message } from "@/types";
import { parseEmoticons } from "@/lib/emoticons";

interface Props {
  message: Message;
  isMine: boolean;
  senderName: string;
}

export default function MessageBubble({ message, isMine, senderName }: Props) {
  const time = new Date(message.createdAt).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const renderedContent = useMemo(
    () => parseEmoticons(message.content),
    [message.content],
  );

  return (
    <div className="mb-2">
      <div
        className={`text-[10px] mb-0.5 ${isMine ? "text-msn-blue-dark" : "text-red-700"}`}
      >
        <span className="font-bold">{senderName}</span>
        <span className="text-gray-500 font-normal ml-1">dice ({time}):</span>
      </div>
      <div className="pl-3 text-[11px] text-black whitespace-pre-wrap break-words">
        {renderedContent}
      </div>
    </div>
  );
}
