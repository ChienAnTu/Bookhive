// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import AuthProvider from "./components/layout/AuthProvider";
import { Toaster } from "./components/ui/sonner";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BookBorrow",
  description: "Share and discover books in Australia",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen flex flex-col bg-gray-100`}
      >
        <AuthProvider>
          <Header />
          <main className="flex-1 pt-16 pb-24 bg-gray-100">{children}</main>
          <Footer />
          <Toaster richColors position="top-right" offset={64} expand={false} />
        </AuthProvider>
      </body>
    </html>
  );
}
