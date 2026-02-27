import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI SDR for Dev Tools",
  description: "Turn an ICP into researched leads and personalized outreach emails — powered by Claude.",
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
