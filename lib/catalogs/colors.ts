export const colors = {
  primary: {
    50:  "#ebf5ff",
    100: "#e1effe",
    200: "#c3ddfd",
    300: "#a4cafe",
    400: "#76a9fa",
    500: "#3f83f8",
    600: "#1c64f2",
    700: "#1a56db",
    800: "#1e429f",
    900: "#233876",
  },
  gray: {
    50:  "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  },
  success: {
    light:   "#def7ec",
    DEFAULT: "#057a55",
    dark:    "#014737",
  },
  warning: {
    light:   "#fef3c7",
    DEFAULT: "#d97706",
    dark:    "#92400e",
  },
  danger: {
    light:   "#fde8e8",
    DEFAULT: "#e02424",
    dark:    "#771d1d",
  },
} as const;

export type ColorScale = keyof typeof colors;
