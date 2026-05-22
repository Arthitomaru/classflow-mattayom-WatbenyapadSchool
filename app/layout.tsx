import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans_Thai, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  variable: "--font-ibm-plex-thai",
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Classflow for Mattayom",
  description: "ระบบจัดการการเรียน ส่งงาน และข้อสอบสำหรับมัธยมศึกษา",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${fraunces.variable} ${ibmPlexSansThai.variable} ${jetbrains.variable} h-full`}>
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
