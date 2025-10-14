"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { prijaviKorisnika } from "../../../lib/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await prijaviKorisnika(email, password);
      // Preusmjeri na natjecanja nakon uspješne prijave
      router.push("/natjecanja");
    } catch (error) {
      console.error("Greška pri prijavi:", error);
      
      // Prikaži user-friendly greške
      let errorMessage = "Greška pri prijavi. Pokušajte ponovo.";
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = "Korisnik s ovom email adresom ne postoji.";
          break;
        case 'auth/wrong-password':
          errorMessage = "Neispravna lozinka.";
          break;
        case 'auth/invalid-email':
          errorMessage = "Neispravna email adresa.";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Previše neuspješnih pokušaja. Pokušajte kasnije.";
          break;
        default:
          errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-white">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm flex flex-col gap-6 border-2 border-[#36b977]">
        <h1 className="text-2xl font-bold text-center text-[#36b977] mb-4">Prijava</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label htmlFor="email" className="text-[#36b977] font-bold text-lg">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Unesi email adresu"
            className="border border-[#36b977] rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#36b977] text-black bg-white font-semibold"
            required
            disabled={loading}
          />
          <label htmlFor="password" className="text-[#36b977] font-bold text-lg">Lozinka</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Unesi lozinku"
            className="border border-[#36b977] rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#36b977] text-black bg-white font-semibold"
            required
            disabled={loading}
          />
          <button 
            type="submit" 
            disabled={loading}
            className="bg-[#36b977] text-white font-bold py-2 rounded hover:bg-[#24995a] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Prijavljivanje..." : "Prijavi se"}
          </button>
        </form>
        
        <div className="text-center text-sm text-gray-600">
          Nemate račun?{" "}
          <Link href="/registracija" className="text-[#36b977] hover:underline font-bold">
            Registrirajte se
          </Link>
        </div>
        
        <Link href="/natjecanja" className="text-center text-sm text-[#36b977] hover:underline">Natrag na natjecanja</Link>
      </div>
    </div>
  );
}
