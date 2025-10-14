"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { dodajNatjecanje } from "../../../lib/natjecanja";
import { useRouter } from "next/navigation";
import { onAuthChange, getCurrentUser } from "../../../lib/auth";

export default function Kreacija() {
  const [naziv, setNaziv] = useState("");
  const [datum, setDatum] = useState("");
  const [opis, setOpis] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();

  // Provjeri autentifikaciju
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      setAuthLoading(false);
      
      // Ako korisnik nije prijavljen, preusmjeri na login
      if (!user) {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Dodatna provjera prije slanja
    if (!user) {
      setError("Morate biti prijavljeni da biste kreirali natjecanje.");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      await dodajNatjecanje({
        naziv,
        datum,
        opis,
        slika: "/slike/placeholder.jpg", // default slika
        createdBy: user.uid, // dodaj info o tome tko je kreirao
        createdByName: user.displayName || user.email
      });
      
      // Reset form
      setNaziv("");
      setDatum("");
      setOpis("");
      
      // Prikaži poruku o uspjehu i preusmjeri
      alert("Natjecanje je uspješno poslano! Admin će pregledati i odobriti natjecanje prije objave.");
      router.push("/natjecanja");
    } catch (error) {
      console.error("Greška pri kreiranju natjecanja:", error);
      setError("Greška pri kreiranju natjecanja. Molimo pokušajte ponovo.");
    } finally {
      setLoading(false);
    }
  };

  // Prikaži loading dok se proverava autentifikacija
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f6f6]">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#36b977] mb-4">
            Proveravanje...
          </div>
          <div className="text-gray-600">
            Molimo pričekajte dok proveravamo vašu prijavu.
          </div>
        </div>
      </div>
    );
  }

  // Ako korisnik nije prijavljen, ne prikazuj formu (će biti preusmeren)
  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f6f6]">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 border border-gray-200 flex flex-col items-center">
        <Image
          src="/slike/logo.jpg.png"
          alt="Logo"
          width={64}
          height={64}
          className="mb-4 rounded border-2 border-gray-300 shadow bg-white"
        />
        <h1 className="text-2xl font-extrabold text-[#36b977] mb-2 tracking-wide">
          Kreacija
        </h1>
        <p className="text-gray-700 text-center mb-6">
          Dobrodošli na stranicu za kreaciju natjecanja. Unesite podatke za novo
          natjecanje.
        </p>
        <form
          onSubmit={handleSubmit}
          className="w-full flex flex-col gap-4"
        >
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div>
            <label
              htmlFor="naziv"
              className="block text-gray-700 font-semibold mb-2"
            >
              Naziv natjecanja
            </label>
            <input
              id="naziv"
              type="text"
              value={naziv}
              onChange={(e) => setNaziv(e.target.value)}
              className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#36b977]"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label
              htmlFor="datum"
              className="block text-gray-700 font-semibold mb-2"
            >
              Datum
            </label>
            <input
              id="datum"
              type="date"
              value={datum}
              onChange={(e) => setDatum(e.target.value)}
              className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#36b977]"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label
              htmlFor="opis"
              className="block text-gray-700 font-semibold mb-2"
            >
              Opis
            </label>
            <textarea
              id="opis"
              value={opis}
              onChange={(e) => setOpis(e.target.value)}
              className="w-full px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#36b977]"
              rows={4}
              required
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-[#36b977] text-white font-bold px-4 py-2 rounded hover:bg-[#24995a] transition-colors duration-200 shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Kreiranje..." : "Kreiraj natjecanje"}
          </button>
        </form>
        <div className="mt-6 text-sm text-gray-500">
          Želite vidjeti postojeća natjecanja?{" "}
          <Link
            href="/natjecanja"
            className="text-[#36b977] font-bold hover:underline"
          >
            Idite na natjecanja
          </Link>
        </div>
      </div>
    </div>
  );
}
