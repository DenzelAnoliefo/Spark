import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { OfflineSyncProvider } from "@/components/providers/offline-sync-provider"; // Import this
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Clearwater Loop",
  description: "Rural Healthcare Coordination",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {/* Wrap the app in the Sync Provider */}
          <OfflineSyncProvider>
            {children}
            <Toaster />
          </OfflineSyncProvider>
        </AuthProvider>
      </body>
    </html>
  );
}