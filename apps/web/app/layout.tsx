import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wheel of Tim",
  description: "A name spinner that randomly selects participants",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

