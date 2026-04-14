import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mi Proyecto",
  description: "Proyecto base con Next.js y Supabase",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
