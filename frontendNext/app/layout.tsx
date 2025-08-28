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
  title: "BookHive",
  description: "Share and discover books in your community",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen flex flex-col bg-gray-100`}
      >
        <AuthProvider>
          <Header />
          <main className="flex-1 pt-16 pb-24 bg-gray-100">{children}</main>
          <Footer />
          <Toaster richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
