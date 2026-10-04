import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sweat CRM Gym · Admin",
  description: "Unified gym management for members, memberships, payments and more",
};

import { RootThemeProvider } from "@/components/theme-provider";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full print:h-auto antialiased`} suppressHydrationWarning>
      <body className="min-h-full print:h-auto print:min-h-0 font-sans">
        <RootThemeProvider>
          {children}
        </RootThemeProvider>
      </body>
    </html>
  );
}
