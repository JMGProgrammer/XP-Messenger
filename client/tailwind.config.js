/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta MSN Messenger / Windows XP
        msn: {
          // Azules de la barra de título y headers
          "blue-dark": "#1F4F9C",
          blue: "#3A6EA5",
          "blue-light": "#7BA6D9",
          "blue-pale": "#D9E5F3",

          // Fondo principal de ventanas MSN
          bg: "#EFF3F7",
          "bg-alt": "#F5F7FA",

          // Bordes
          border: "#A0B8D8",
          "border-dark": "#5A7CAC",

          // Estados
          online: "#5BAE2C",
          away: "#E8A100",
          busy: "#C84040",
          offline: "#999999",

          // Hover de items
          hover: "#D6E5F5",
        },
        xp: {
          // Azules Windows XP (taskbar, ventanas del SO)
          "taskbar-start": "#245EDB",
          "taskbar-end": "#3A93FF",
          "titlebar-start": "#0058E6",
          "titlebar-mid": "#3C81F3",
          "titlebar-end": "#3A93FF",
          "green-start": "#5EAC56",
          "green-end": "#3C8B36",
          "window-bg": "#ECE9D8",
          "button-face": "#ECE9D8",
        },
      },
      fontFamily: {
        // MSN clásico usaba Tahoma; Segoe UI fallback
        msn: ["Tahoma", "Segoe UI", "Verdana", "sans-serif"],
      },
      boxShadow: {
        "msn-window": "2px 2px 8px rgba(0, 0, 0, 0.3)",
        "msn-inset":
          "inset 1px 1px 0 rgba(255,255,255,0.7), inset -1px -1px 0 rgba(0,0,0,0.15)",
      },
      backgroundImage: {
        "msn-titlebar": "linear-gradient(to bottom, #3C81F3 0%, #1F4F9C 100%)",
        "xp-titlebar":
          "linear-gradient(to bottom, #0058E6 0%, #3C81F3 50%, #1F4F9C 100%)",
        "xp-taskbar": "linear-gradient(to bottom, #245EDB 0%, #3A93FF 100%)",
      },
    },
  },
  plugins: [],
};
