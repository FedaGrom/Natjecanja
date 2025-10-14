"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { posaljiZahtjevZaRegistraciju } from "../../../lib/auth";

export default function Registracija() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Provjeri da li se lozinke podudaraju
    if (password !== confirmPassword) {
      setError("Lozinke se ne podudaraju.");
      setLoading(false);
      return;
    }

    // Provjeri duljinu lozinke
    if (password.length < 6) {
      setError("Lozinka mora imati najmanje 6 karaktera.");
      setLoading(false);
      return;
    }

    try {
      await posaljiZahtjevZaRegistraciju(email, password, displayName);
      setSuccess(true);
    } catch (error) {
      console.error("Greška pri slanju zahtjeva za registraciju:", error);
      
      // Prikaži user-friendly greške
      let errorMessage = "Greška pri slanju zahtjeva za registraciju. Pokušajte ponovo.";
      
      if (error.message.includes('email-already-in-use')) {
        errorMessage = "Zahtjev s ovom email adresom već postoji.";
      } else if (error.message.includes('invalid-email')) {
        errorMessage = "Neispravna email adresa.";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-white">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md flex flex-col gap-6 border-2 border-[#36b977]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#36b977] mb-4">Zahtjev poslan!</h1>
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              Vaš zahtjev za registraciju je uspješno poslan. Admin će pregledati vaš zahtjev i obavijestiti vas o odluci.
            </div>
            <p className="text-gray-600 mb-6">
              Molimo pričekajte da admin odobri vaš zahtjev. Dobit ćete email kad račun bude spreman.
            </p>
            <div className="flex gap-4">
              <Link href="/login" className="flex-1">
                <button className="w-full bg-[#36b977] text-white font-bold py-2 rounded hover:bg-[#24995a] transition-all">
                  Idi na prijavu
                </button>
              </Link>
              <Link href="/natjecanja" className="flex-1">
                <button className="w-full bg-gray-500 text-white font-bold py-2 rounded hover:bg-gray-600 transition-all">
                  Natrag na natjecanja
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-white">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md flex flex-col gap-6 border-2 border-[#36b977]">
        <h1 className="text-2xl font-bold text-center text-[#36b977] mb-4">Registracija</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label htmlFor="displayName" className="text-[#36b977] font-bold text-lg">Ime i prezime</label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Unesi ime i prezime"
            className="border border-[#36b977] rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#36b977] text-black bg-white font-semibold"
            required
            disabled={loading}
          />
          
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
            placeholder="Unesi lozinku (min 6 karaktera)"
            className="border border-[#36b977] rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#36b977] text-black bg-white font-semibold"
            required
            disabled={loading}
            minLength={6}
          />
          
          <label htmlFor="confirmPassword" className="text-[#36b977] font-bold text-lg">Potvrdi lozinku</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Ponovi lozinku"
            className="border border-[#36b977] rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#36b977] text-black bg-white font-semibold"
            required
            disabled={loading}
          />
          
          <button 
            type="submit" 
            disabled={loading}
            className="bg-[#36b977] text-white font-bold py-2 rounded hover:bg-[#24995a] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Registriranje..." : "Registriraj se"}
          </button>
        </form>
        
        <div className="text-center text-sm text-gray-600">
          Već imate račun?{" "}
          <Link href="/login" className="text-[#36b977] hover:underline font-bold">
            Prijavite se
          </Link>
        </div>
        
        <Link href="/natjecanja" className="text-center text-sm text-[#36b977] hover:underline">Natrag na natjecanja</Link>
      </div>
    </div>
  );
}
