import type { UserStatus } from "@/types";

interface StatusIconProps {
  status: UserStatus;
  size?: number;
}

/**
 * Iconito clásico de MSN: muñequito estilizado.
 * - online: verde
 * - away: amarillo con reloj
 * - busy: rojo con prohibido
 * - offline: gris transparente
 */
export default function StatusIcon({ status, size = 14 }: StatusIconProps) {
  const colors: Record<UserStatus, { body: string; outline: string }> = {
    online: { body: "#5BAE2C", outline: "#2D6E15" },
    away: { body: "#E8A100", outline: "#946600" },
    busy: { body: "#C84040", outline: "#7E1F1F" },
    offline: { body: "#B8B8B8", outline: "#7A7A7A" },
  };
  const c = colors[status];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      style={{ flexShrink: 0 }}
      aria-label={status}
    >
      {/* Cabeza */}
      <circle
        cx="8"
        cy="4.5"
        r="2.5"
        fill={c.body}
        stroke={c.outline}
        strokeWidth="0.8"
      />
      {/* Cuerpo (trapecio redondeado) */}
      <path
        d="M3 14 C 3 9, 13 9, 13 14 Z"
        fill={c.body}
        stroke={c.outline}
        strokeWidth="0.8"
      />
      {/* Indicador específico de estado */}
      {status === "busy" && (
        <circle
          cx="11"
          cy="11"
          r="3"
          fill="white"
          stroke="#7E1F1F"
          strokeWidth="1.2"
        />
      )}
      {status === "busy" && (
        <line
          x1="9"
          y1="11"
          x2="13"
          y2="11"
          stroke="#C84040"
          strokeWidth="1.5"
        />
      )}
      {status === "away" && (
        <circle
          cx="11"
          cy="11"
          r="3"
          fill="white"
          stroke="#946600"
          strokeWidth="1"
        />
      )}
      {status === "away" && (
        <line x1="11" y1="9" x2="11" y2="11" stroke="#946600" strokeWidth="1" />
      )}
      {status === "away" && (
        <line
          x1="11"
          y1="11"
          x2="12.5"
          y2="11.5"
          stroke="#946600"
          strokeWidth="1"
        />
      )}
    </svg>
  );
}
