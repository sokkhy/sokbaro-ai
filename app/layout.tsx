import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SokBaro AI — Your AI Posture Coach",
  description:
    "Real-time, privacy-first posture coaching from your webcam. Sit better, work better.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
