import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import QueryProvider from "./components/providers/QueryProvider";
import { UIProvider } from "./providers/UIProvider";
import { WorkspaceProvider } from "./providers/WorkspaceProvider";
import CommandPalette from "./components/ui/CommandPalette";

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
        <QueryProvider>
          <UIProvider>
            <WorkspaceProvider>
              {children}
              <CommandPalette />
              <Toaster richColors position="top-center" />
            </WorkspaceProvider>
          </UIProvider>
        </QueryProvider>
      </body>
    </html>
  );
}