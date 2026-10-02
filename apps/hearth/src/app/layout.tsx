import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const display = localFont({
  src: "./fonts/BricolageGrotesque-Variable.ttf",
  variable: "--font-bricolage",
  display: "swap",
});

const ui = localFont({
  src: [
    { path: "./fonts/DMSans-Variable.ttf", style: "normal" },
    { path: "./fonts/DMSans-Italic-Variable.ttf", style: "italic" },
  ],
  variable: "--font-dm-sans",
  display: "swap",
});

const serif = localFont({
  src: [
    { path: "./fonts/InstrumentSerif-Regular.ttf", style: "normal", weight: "400" },
    { path: "./fonts/InstrumentSerif-Italic.ttf", style: "italic", weight: "400" },
  ],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hearth",
  description: "Two people. One small ritual.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Hearth",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#fbf8f3",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${ui.variable} ${serif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
