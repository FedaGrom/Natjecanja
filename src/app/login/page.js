"use client";
import { useState } from "react";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase/config";
import { useRouter } from "next/navigation";
import Swal from 'sweetalert2';

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
      
      // Show success alert
      await Swal.fire({
        icon: 'success',
        title: 'Uspješna prijava!',
        text: 'Dobro došli',
        timer: 1500,
        showConfirmButton: false
      });
      
      router.push("/natjecanja");
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
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">{/* prevent horizontal scroll on mobile */}
      {/* Header */}
      <header className="sticky top-0 w-full bg-[#666] shadow-md border-b border-gray-200 z-50">
        <div className="flex items-center justify-between px-4 py-2">
          {/* Lijevo - Škola info i logo */}
          <div className="flex items-center gap-3">
            <img
              src="/slike/logo.jpg.png"
              alt="Logo"
              width={48}
              height={48}
              className="rounded border-2 border-gray-300 shadow bg-white"
            />
            <div className="flex flex-col">
              <span className="text-base font-bold text-white leading-tight">
                III. gimnazija, Split
              </span>
              <span className="text-sm text-white leading-tight hidden sm:block">{/* hide tagline on xs */}
                Prirodoslovno-matematička gimnazija
              </span>
            </div>
          </div>

          {/* Sredina - Naslov PRIJAVA */}
          <h1 className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl lg:text-3xl font-extrabold text-white whitespace-nowrap tracking-wide transition-all duration-300 hover:scale-110 hover:text-[#36b977] cursor-pointer">
            PRIJAVA
          </h1>

          {/* Desno - Home i Registracija buttons */}
          <div className="flex items-center gap-4">
            <Link href="/natjecanja">
              <button className="bg-white text-[#666] font-bold px-4 py-2 rounded hover:bg-[#36b977] hover:text-white transition-colors duration-200 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                </svg>
                Početna
              </button>
            </Link>
            
            <Link href="/registracija">
              <button className="bg-white text-[#666] font-bold px-4 py-2 rounded hover:bg-[#36b977] hover:text-white transition-colors duration-200">
                Registracija
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile title below header */}
      <div className="md:hidden px-4 py-3 bg-white border-b border-gray-200">
        <h1 className="text-xl font-extrabold text-[#36b977] text-center tracking-wide">PRIJAVA</h1>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 border-2 border-[#36b977]">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Prijava</h2>
          </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email adresa
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#36b977] focus:border-[#36b977] text-gray-900 bg-white"
              placeholder="Unesite email adresu"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Lozinka
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#36b977] focus:border-[#36b977] text-gray-900 bg-white"
              placeholder="Unesite lozinku"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#36b977] text-white py-2 px-4 rounded-md hover:bg-[#24995a] focus:outline-none focus:ring-2 focus:ring-[#36b977] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Prijavljivanje...' : 'Prijavite se'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-4">
            <p className="text-lg font-semibold text-blue-700 mb-2">
              Nemate račun?
            </p>
            <p className="text-base text-blue-600 mb-3">
              Pošaljite zahtjev administratoru za registraciju na platformu natjecanja. Administrator će pregledati vaš zahtjev u administratorskom panelu.
            </p>
            <Link href="/registracija">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium">
                Zahtjev za registraciju
              </button>
            </Link>
          </div>
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              Alternativno, možete se obratiti svojem profesoru informatike ili administratoru sustava.
            </p>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
