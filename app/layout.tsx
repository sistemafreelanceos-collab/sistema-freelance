import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // <--- ESTE ES EL IMPORTANTE AQUÍ

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FreelanceOS",
  description: "Sistema para Independientes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}