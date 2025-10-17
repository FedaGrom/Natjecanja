"use client";
import { useState } from "react";
import Link from "next/link";
import { auth } from "../../firebase/config";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful:', userCredential.user.email);
      alert('Uspješna prijava! Preusmjeravanje...');
      
      // Use router.push and refresh
      router.push("/natjecanja");
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);
      let errorMessage = "Pogrešni podaci za prijavu. Provjerite email i lozinku.";
      
      if (err.code === 'auth/invalid-credential') {
        errorMessage = "Neispravni podaci za prijavu. Provjerite email i lozinku.";
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = "Korisnik s ovim email-om ne postoji.";
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = "Pogrešna lozinka.";
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = "Neispravan email format.";
      } else if (err.code === 'auth/user-disabled') {
        errorMessage = "Korisnički račun je onemogućen.";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="w-full flex items-center justify-between px-6 py-2 bg-[#666] shadow-md border-b border-gray-200 relative">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-start mr-4">
            <span className="text-base font-bold text-white leading-tight">
              III. gimnazija, Split
            </span>
            <span className="text-sm text-white leading-tight">
              Prirodoslovno-matematička gimnazija
            </span>
          </div>
          <Link href="/">
            <button className="bg-white text-[#666] font-bold px-4 py-2 rounded hover:bg-[#36b977] hover:text-white transition-colors duration-200">
              POČETNA
            </button>
          </Link>
        </div>
        <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl font-extrabold text-white whitespace-nowrap tracking-wide transition-all duration-300 hover:scale-110 hover:text-[#36b977] cursor-pointer">
          PRIJAVA
        </h1>
      </header>

      <div className="flex flex-col items-center justify-center flex-1 px-6 py-12">
        <div className="w-full max-w-md bg-gray-50 p-8 rounded-xl shadow-lg">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-[#666] mb-2">
                Email adresa
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded px-4 py-2 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#36b977]"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-[#666] mb-2">
                Lozinka
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded px-4 py-2 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#36b977]"
                required
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#36b977] disabled:opacity-50 text-white font-bold px-4 py-3 rounded hover:bg-[#24995a] transition-colors duration-200"
            >
              {loading ? "Prijavljivanje..." : "Prijavi se"}
            </button>
          </form>

          <div className="mt-8 p-4 bg-blue-50 rounded border border-blue-200">
            <h3 className="font-bold text-blue-800 mb-2">Potreban je račun?</h3>
            <p className="text-blue-700 text-sm">
              Za registraciju novog korisničkog računa obratite se svome profesoru iz informatike.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
