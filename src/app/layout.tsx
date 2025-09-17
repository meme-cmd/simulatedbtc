import type { Metadata } from "next";
import { WalletContextProvider } from "@/components/WalletProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "SimBTC - Bitcoin Mining Simulator",
  description: "A nostalgic Bitcoin mining simulator with real Solana integration and Windows XP styling",
  icons: {
    icon: '/simbtclogo.png',
    shortcut: '/simbtclogo.png',
    apple: '/simbtclogo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://unpkg.com/xp.css" />
        <link rel="icon" href="/simbtclogo.png" type="image/png" />
        <link rel="shortcut icon" href="/simbtclogo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/simbtclogo.png" />
      </head>
      <body>
        <WalletContextProvider>
          {children}
        </WalletContextProvider>
      </body>
    </html>
  );
}
