import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Natjecanja - III. gimnazija Split",
  description: "Portal za natjecanja III. gimnazije Split",
  icons: {
    icon: "/slike/logo.jpg.png",
    // optional: set shortcut and apple icons if desired
    shortcut: "/slike/logo.jpg.png",
    apple: "/slike/logo.jpg.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="hr">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
