import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wheel of Tim",
  description: "A spin-the-wheel random name picker built for Vercel.",
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
