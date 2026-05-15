/**
 * Emoticones clásicos de MSN Messenger mapeados a Unicode.
 * El parser detecta los códigos y los reemplaza al renderizar.
 */

export interface Emoticon {
  /** Códigos de texto que activan este emoticón */
  codes: string[];
  /** Emoji Unicode */
  emoji: string;
  /** Etiqueta para el picker */
  label: string;
}

// Catálogo. Los códigos están ordenados de más largo a más corto para que el
// parser no confunda ":)" con ":))" — siempre prioriza matches largos.
export const EMOTICONS: Emoticon[] = [
  // Caras
  { codes: [":)", ":-)"], emoji: "🙂", label: "Sonrisa" },
  { codes: [":D", ":-D"], emoji: "😄", label: "Risa" },
  { codes: [":P", ":-P", ":p"], emoji: "😛", label: "Lengua" },
  { codes: [":(", ":-("], emoji: "😢", label: "Triste" },
  { codes: [":'(", ":'-("], emoji: "😭", label: "Llorando" },
  { codes: [":|", ":-|"], emoji: "😐", label: "Neutral" },
  { codes: [";)", ";-)"], emoji: "😉", label: "Guiño" },
  { codes: [":O", ":-O", ":o"], emoji: "😮", label: "Sorpresa" },
  { codes: [">:("], emoji: "😠", label: "Enojado" },
  { codes: [":$", ":-$"], emoji: "😳", label: "Avergonzado" },
  { codes: ["(H)", "8-)"], emoji: "😎", label: "Cool" },
  { codes: [":S", ":-S"], emoji: "😕", label: "Confundido" },
  { codes: [":*", ":-*"], emoji: "😘", label: "Beso" },
  { codes: ["(A)"], emoji: "😇", label: "Ángel" },
  { codes: ["(6)"], emoji: "😈", label: "Diablito" },
  { codes: ["(M)"], emoji: "😴", label: "Dormido" },

  // Símbolos clásicos MSN
  { codes: ["(L)"], emoji: "❤️", label: "Corazón" },
  { codes: ["(U)"], emoji: "💔", label: "Corazón roto" },
  { codes: ["(Y)"], emoji: "👍", label: "Pulgar arriba" },
  { codes: ["(N)"], emoji: "👎", label: "Pulgar abajo" },
  { codes: ["(K)"], emoji: "💋", label: "Beso labios" },
  { codes: ["(F)"], emoji: "🌹", label: "Flor" },
  { codes: ["(P)"], emoji: "📷", label: "Cámara" },
  { codes: ["(T)"], emoji: "📞", label: "Teléfono" },
  { codes: ["(*)"], emoji: "⭐", label: "Estrella" },
  { codes: ["(8)"], emoji: "🎵", label: "Música" },
  { codes: ["(D)"], emoji: "🍺", label: "Cerveza" },
  { codes: ["(C)"], emoji: "☕", label: "Café" },
  { codes: ["(@)"], emoji: "🐱", label: "Gato" },
  { codes: ["(&)"], emoji: "🐶", label: "Perro" },
  { codes: ["(pi)"], emoji: "🍕", label: "Pizza" },
  { codes: ["(B)"], emoji: "🍺", label: "Cerveza" },
  { codes: ["(~)"], emoji: "🎬", label: "Película" },
  { codes: ["(I)"], emoji: "💡", label: "Idea" },
];

// Para parsing rápido, generamos un mapa "código -> emoji" en orden de longitud
// (descendente) y un regex que matchea cualquiera de los códigos.
const sortedCodes = EMOTICONS.flatMap((e) =>
  e.codes.map((c) => ({ code: c, emoji: e.emoji })),
).sort((a, b) => b.code.length - a.code.length);

// Escapar caracteres especiales para regex
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Regex que matchea cualquier emoticón. La 'g' es para reemplazar todos.
const EMOTICON_REGEX = new RegExp(
  sortedCodes.map((c) => escapeRegex(c.code)).join("|"),
  "g",
);

const codeToEmoji = new Map(sortedCodes.map((c) => [c.code, c.emoji]));

/**
 * Reemplaza códigos de emoticones en un texto por sus emojis Unicode.
 */
export function parseEmoticons(text: string): string {
  return text.replace(
    EMOTICON_REGEX,
    (match) => codeToEmoji.get(match) ?? match,
  );
}
