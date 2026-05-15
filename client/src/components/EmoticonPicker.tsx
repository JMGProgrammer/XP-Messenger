import { useEffect, useRef } from "react";
import { EMOTICONS } from "@/lib/emoticons";

interface Props {
  onPick: (code: string) => void;
  onClose: () => void;
}

export default function EmoticonPicker({ onPick, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 mb-1 bg-white border border-gray-500 shadow-lg p-1 z-20 w-[200px]"
    >
      <div className="text-[10px] text-msn-blue-dark font-bold px-1 py-0.5 border-b border-gray-300 mb-1">
        Insertar emoticón
      </div>
      <div className="grid grid-cols-6 gap-0.5">
        {EMOTICONS.map((e) => (
          <button
            key={e.codes[0]}
            type="button"
            onClick={() => {
              onPick(e.codes[0]);
              onClose();
            }}
            title={`${e.label} (${e.codes[0]})`}
            className="text-base p-1 hover:bg-msn-blue-pale rounded transition-colors"
          >
            {e.emoji}
          </button>
        ))}
      </div>
      <div className="text-[9px] text-gray-500 px-1 pt-1 border-t border-gray-300 mt-1">
        Tip: también podés tipear los códigos como :) o (L)
      </div>
    </div>
  );
}
