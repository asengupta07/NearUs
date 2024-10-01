import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/authContext";

const inter = Inter({ subsets: ["latin"] });
const darkMode = true;

export const metadata: Metadata = {
  title: "NearUs",
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
          {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
