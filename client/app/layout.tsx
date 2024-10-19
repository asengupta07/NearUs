import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/authContext";
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });
const darkMode = true;

export const metadata: Metadata = {
  title: "NearUs",
  description: "An intuitive event planner for connecting with friends and family",
  generator: "NearUs Team",
  manifest: "/manifest.json",
  keywords: ["social", "lifestyle", "productivity"],
  icons: [
    { rel: "icon", url: "icons/icon-128x128.png" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${darkMode ? "dark" : ""}`}>
      <body className={inter.className}>
        <ThemeProvider attribute="class">
          <AuthProvider>
            <Suspense>
              {children}
            </Suspense>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
