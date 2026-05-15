import { useMessagesStore } from "@/store/messagesStore";

export default function ErrorToast() {
  const error = useMessagesStore((s) => s.lastError);
  const clearError = useMessagesStore((s) => s.clearError);

  if (!error) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] msn-window max-w-sm">
      <div className="msn-titlebar bg-red-700">
        <span>⚠ Error</span>
        <div className="msn-titlebar-buttons">
          <button
            className="msn-titlebar-button close"
            onClick={clearError}
            title="Cerrar"
          >
            ×
          </button>
        </div>
      </div>
      <div className="p-3 bg-msn-bg text-[11px] text-gray-800">{error}</div>
    </div>
  );
}
