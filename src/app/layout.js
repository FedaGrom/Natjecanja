import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  
  title: "Natjecanja - III. gimnazija Split",
  description: "Portal za natjecanja III. gimnazije Split",
};

export default function RootLayout({ children }) {
  console.log('RootLayout: Rendering with AuthProvider');
  return (
    <html lang="hr">
      <body className={inter.className}>
        <AuthProvider>
          {console.log('RootLayout: Children wrapped in AuthProvider')}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
