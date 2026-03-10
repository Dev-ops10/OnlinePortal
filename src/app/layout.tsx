import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "B2B Ordering Portal",
  description: "Commercial Equipment & Smallwares Ordering System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
