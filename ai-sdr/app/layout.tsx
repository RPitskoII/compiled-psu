import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Propelr.ai",
  description: "Turn an ICP into researched leads and personalized outreach emails.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
