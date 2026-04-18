import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "CPFoxtrot",
  description: "Dashboard de inversiones y finanzas personales",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  );
}