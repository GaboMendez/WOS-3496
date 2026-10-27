import type { Metadata } from "next";
import { JetBrains_Mono, Work_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
});

export const metadata: Metadata = {
  title: "State 3496 — Whiteout Survival Community",
  description: "Unofficial community portal for State 3496 in Whiteout Survival.",
  openGraph: {
    title: "State 3496 — Whiteout Survival Community",
    description: "Unofficial community portal for State 3496 in Whiteout Survival.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jetbrainsMono.variable} ${workSans.variable}`}>
      <body className="font-sans min-h-screen bg-background text-foreground antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
