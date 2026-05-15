type SoundName = "login" | "message-in" | "message-out" | "nudge" | "logout";

const SOUND_PATHS: Record<SoundName, string> = {
  login: "/sounds/login.mp3",
  "message-in": "/sounds/message-in.mp3",
  "message-out": "/sounds/message-out.mp3",
  nudge: "/sounds/nudge.mp3",
  logout: "/sounds/logout.mp3",
};

const audioCache = new Map<SoundName, HTMLAudioElement>();
let enabled = true;

export function setSoundsEnabled(value: boolean) {
  enabled = value;
  try {
    localStorage.setItem("xp-sounds-enabled", value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function getSoundsEnabled(): boolean {
  try {
    const saved = localStorage.getItem("xp-sounds-enabled");
    if (saved !== null) enabled = saved === "1";
  } catch {
    /* ignore */
  }
  return enabled;
}

export function playSound(name: SoundName) {
  console.log("🔊 playSound llamado:", name);
  if (!getSoundsEnabled()) return;

  let audio = audioCache.get(name);
  if (!audio) {
    audio = new Audio(SOUND_PATHS[name]);
    audio.volume = name === "nudge" ? 0.6 : 0.4;
    audioCache.set(name, audio);
  }

  audio.currentTime = 0;
  audio.play().catch(() => {
    // ignore (autoplay blocked o archivo no encontrado)
  });
}
