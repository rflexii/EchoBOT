import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ramat — Echo Systems AI Assistant",
  description:
    "Ramat is the AI customer service and sales assistant for Echo Systems. Get instant answers about our services, or connect with our team.",
};

export const viewport: Viewport = {
  themeColor: "#1c6ff5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
