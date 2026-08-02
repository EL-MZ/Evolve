import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Evolve — Weekly Goal Tracker",
  description: "Turn weekly intentions into visible momentum.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
