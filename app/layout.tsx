import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CurritoAgents · Panel",
  description: "Panel interno de gestión de leads de CurritoAgents",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="bg-slate-950 text-slate-100 antialiased">{children}</body>
    </html>
  );
}
