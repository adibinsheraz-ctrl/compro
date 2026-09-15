import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// BespokeStencil — display face for all site headings, self-hosted.
const bespokeStencil = localFont({
  src: "../fonts/BespokeStencil-Variable.woff2",
  variable: "--font-heading",
  weight: "100 900",
  display: "swap",
});

// Oh My Notes — handwriting face for body/paragraph text, self-hosted.
const ohMyNotes = localFont({
  src: "../fonts/OhMyNotes.woff",
  variable: "--font-notes",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chance Tracker: Kips College",
  description:
    "One chance. Then a fine. Live classroom tracker for Kips College computer class.",
  applicationName: "Kips Chance Tracker",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#14181A",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexMono.variable} ${bespokeStencil.variable} ${ohMyNotes.variable} h-full`}
    >
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
