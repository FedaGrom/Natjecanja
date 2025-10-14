"use client";
import Image from "next/image";
import Button from "../components/Button";
import Link from "next/link";
import { useState, useEffect } from "react";
import { dohvatiNatjecanja } from "../../../lib/natjecanja";
import { onAuthChange, odjaviKorisnika } from "../../../lib/auth";
import { isAdmin } from "../../../lib/admin";

export default function Natjecanja() {
  const [selected, setSelected] = useState("");
  const [godina, setGodina] = useState("");
  const [search, setSearch] = useState("");
  const [natjecanja, setNatjecanja] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  // Provjeri autentifikaciju i admin status
  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setUser(user);
      
      if (user) {
        // Provjeri da li je admin
        const adminStatus = await isAdmin(user.uid);
        setIsUserAdmin(adminStatus);
      } else {
        setIsUserAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Funkcija za ručno osvježavanje podataka
  const refreshNatjecanja = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await dohvatiNatjecanja();
      setNatjecanja(data);
    } catch (error) {
      console.error("Greška pri dohvaćanju natjecanja:", error);
      setError("Greška pri učitavanju natjecanja. Provjerite internetsku vezu.");
    } finally {
      setLoading(false);
    }
  };

  // Funkcija za odjavu
  const handleLogout = async () => {
    try {
      await odjaviKorisnika();
    } catch (error) {
      console.error("Greška pri odjavi:", error);
    }
  };
  useEffect(() => {
    const fetchNatjecanja = async () => {
      try {
        setLoading(true);
        const data = await dohvatiNatjecanja();
        setNatjecanja(data);
        setError(""); // Ukloni prethodne greške ako je uspješno
      } catch (error) {
        console.error("Greška pri dohvaćanju natjecanja:", error);
        setError("Greška pri učitavanju natjecanja. Provjerite internetsku vezu.");
        setNatjecanja([]); // Postavi prazan niz umjesto test podataka
      } finally {
        setLoading(false);
      }
    };

    fetchNatjecanja();
  }, []);
  // Filter competitions by year and search
  const filtriranaNatjecanja = natjecanja.filter(n => {
    const byYear = godina ? n.datum.startsWith(godina) : true;
    const bySearch = search ? n.naziv.toLowerCase().includes(search.toLowerCase()) : true;
    return byYear && bySearch;
  });

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
          NATJECANJA
        </h1>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-white font-semibold">
                Dobrodošli, {user.displayName || user.email}
              </span>
              {isUserAdmin && (
                <Link href="/admin">
                  <button className="bg-blue-500 text-white font-bold px-4 py-2 rounded hover:bg-blue-600 transition-colors duration-200">
                    Admin Panel
                  </button>
                </Link>
              )}
              <button 
                onClick={handleLogout}
                className="bg-white text-[#666] font-bold px-4 py-2 rounded hover:bg-red-500 hover:text-white transition-colors duration-200"
              >
                Odjava
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <button className="bg-white text-[#666] font-bold px-4 py-2 rounded hover:bg-[#36b977] hover:text-white transition-colors duration-200">
                  Prijava
                </button>
              </Link>
              <Link href="/registracija">
                <button className="bg-[#36b977] text-white font-bold px-4 py-2 rounded hover:bg-[#24995a] transition-colors duration-200">
                  Registracija
                </button>
              </Link>
            </div>
          )}
          <Image
            src="/slike/logo.jpg.png"
            alt="Logo"
            width={64}
            height={64}
            className="rounded border-2 border-gray-300 shadow bg-white"
          />
        </div>
      </header>
      <div className="w-full flex justify-center py-4 bg-white gap-4">
        <Link href="/kreacija">
          <button className="bg-[#36b977] text-white font-bold px-6 py-2 rounded hover:bg-[#24995a] transition-colors duration-200 mb-2">
            Kreiraj natjecanje
          </button>
        </Link>
        <label htmlFor="godina" className="text-[#36b977] text-lg font-bold mr-2"></label>
        <select
          id="godina"
          className="p-2 rounded text-[#36b977] font-bold bg-white border-[#36b977] border-2 w-40"
          value={godina}
          onChange={e => setGodina(e.target.value)}
        >
          <option value="">Sve godine</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
          <option value="2022">2022</option>
        </select>
        <input
          type="text"
          placeholder="Pretraži natjecanja..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 bg-white text-black rounded px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-green-600 placeholder-gray-500 transition-colors duration-200 hover:border-green-600 hover:bg-green-100 hover:text-green-900 hover:placeholder-green-700"
        />
      </div>
      {/* Render competitions as large rectangles */}
      <div className="flex flex-col items-center gap-4 py-8 w-full">
        {loading && (
          <div className="text-center py-8">
            <div className="text-xl text-gray-600">Učitavanje natjecanja...</div>
          </div>
        )}
        
        {error && (
          <div className="text-center py-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 max-w-md mx-auto">
              {error}
            </div>
            <button
              onClick={refreshNatjecanja}
              disabled={loading}
              className="bg-[#36b977] text-white font-bold px-6 py-2 rounded hover:bg-[#24995a] transition-colors duration-200 disabled:opacity-50"
            >
              {loading ? "Osvježavanje..." : "Pokušaj ponovo"}
            </button>
          </div>
        )}
        
        {!loading && !error && filtriranaNatjecanja.length === 0 && (
          <div className="text-center py-8">
            <div className="text-xl text-gray-600 mb-4">Nema natjecanja za prikaz.</div>
            {user ? (
              <Link href="/kreacija">
                <button className="bg-[#36b977] text-white font-bold px-6 py-2 rounded hover:bg-[#24995a] transition-colors duration-200">
                  Kreiraj prvo natjecanje
                </button>
              </Link>
            ) : (
              <div className="text-gray-500">
                <Link href="/login" className="text-[#36b977] hover:underline font-bold">
                  Prijavite se
                </Link>
                {" "}da biste mogli kreirati natjecanja.
              </div>
            )}
          </div>
        )}
        
        {!loading && !error && filtriranaNatjecanja.map(natjecanje => (
          <div key={natjecanje.id} className="w-1/2 min-h-[200px] bg-white rounded-xl shadow-lg p-8 border-2 border-[#36b977] flex flex-col items-start justify-center">
            <Image
              src={natjecanje.slika || "/slike/placeholder.jpg"}
              alt={natjecanje.naziv}
              width={600}
              height={192}
              className="w-full h-48 object-cover rounded mb-4 border border-gray-200"
            />
            <span className="text-2xl font-bold text-[#666] mb-2">{natjecanje.naziv}</span>
            <span className="text-lg text-[#36b977]">Datum: {natjecanje.datum}</span>
            {natjecanje.opis && (
              <span className="text-md text-gray-700 mt-2">{natjecanje.opis}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
