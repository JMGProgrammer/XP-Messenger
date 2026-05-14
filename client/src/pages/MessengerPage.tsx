import { useEffect, useState } from "react";
import MainWindow from "@/components/MainWindow";

export default function MessengerPage() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 30_000); // actualizar reloj cada 30s
    return () => clearInterval(id);
  }, []);

  return (
    <div className="xp-desktop">
      {/* Ventana principal MSN (arrastrable) */}
      <MainWindow />

      {/* Taskbar XP */}
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
