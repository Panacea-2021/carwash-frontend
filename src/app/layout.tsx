import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Prajwaala Ankura Properties",
  description: "Crafting premium residential spaces with structural excellence and modern architectural layouts.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F5F0EB]">
        <main className="min-h-screen relative overflow-hidden flex flex-col">
          {/* --- LUXURY AMBIENT BACKGROUND --- */}
          <div className="fixed inset-0 z-0 pointer-events-none">
            {/* Fine Paper Grain Texture */}
            <div className="absolute inset-0 bg-noise opacity-[0.035] mix-blend-multiply"></div>
            
            {/* Ambient Glowing Orbs — responsive sizes */}
            <div className="absolute top-[-15%] left-[-12%] w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] md:w-[45vw] md:h-[45vw] lg:w-[55vw] lg:h-[55vw] rounded-full bg-[#C9A96E]/[0.07] blur-[80px] sm:blur-[100px] md:blur-[140px] animate-float"></div>
            <div className="absolute bottom-[-15%] right-[-12%] w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] md:w-[50vw] md:h-[50vw] lg:w-[60vw] lg:h-[60vw] rounded-full bg-[#d5a86a]/[0.05] blur-[80px] sm:blur-[120px] md:blur-[160px] animate-float-delayed"></div>
            <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] md:w-[35vw] md:h-[35vw] lg:w-[40vw] lg:h-[40vw] rounded-full bg-stone-300/[0.06] blur-[70px] sm:blur-[100px] md:blur-[130px] animate-float"></div>

            {/* Subtle Architectural Grid — responsive sizing */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.018)_1px,transparent_1px)] bg-[size:40px_40px] sm:bg-[size:60px_60px] md:bg-[size:80px_80px]"></div>
          </div>

          <div className="relative z-10 flex flex-col min-h-screen justify-between">
            <div>
              <Navbar />
              {children}
            </div>
            <Footer />
          </div>
        </main>
      </body>
    </html>
  );
}

