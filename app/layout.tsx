import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KeepAlive — Website Monitor",
  description: "A small personal website uptime monitor."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
