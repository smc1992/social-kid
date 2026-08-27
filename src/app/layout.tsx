import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Social Kid Studio | AI Kids Songs & YouTube Video Generator",
  description: "Erstelle mit KI fröhliche Kinderlieder mit Gesang (Kie.ai Suno), bunten 3D-Bildsequenzen (Flux) und synchronisierten Karaoke-Untertiteln für YouTube.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" suppressHydrationWarning className="h-full antialiased">
      <body suppressHydrationWarning className="min-h-full flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
