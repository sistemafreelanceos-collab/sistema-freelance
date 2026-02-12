import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import QueryProvider from "./components/providers/QueryProvider";
import { UIProvider } from "./providers/UIProvider";
import { WorkspaceProvider } from "./providers/WorkspaceProvider";
import CommandPalette from "./components/ui/CommandPalette";
import MotivationSystem from "./components/MotivationSystem";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Onyx Dashboard",
  description: "Sistema Operativo para Negocios",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Onyx",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-[#0D1117] text-gray-200 antialiased`}>
        <QueryProvider>
          <UIProvider>
            <WorkspaceProvider>
              <MotivationSystem />
              {children}
              <CommandPalette />
            </WorkspaceProvider>
          </UIProvider>
        </QueryProvider>
        <Toaster position="bottom-right" theme="dark" />
      </body>
    </html>
  );
}