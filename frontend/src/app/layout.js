import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { OfflineSyncProvider } from "@/components/providers/offline-sync-provider";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Closed-Loop Referrals",
  description: "Rural clinic referral tracking — never let referrals fall through the cracks",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AuthProvider>
            <OfflineSyncProvider>
              {children}
              <Toaster />
            </OfflineSyncProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
