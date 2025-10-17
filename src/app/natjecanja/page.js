"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";

export default function Natjecanja() {
  const [selected, setSelected] = useState("");
  const [godina, setGodina] = useState("");
  const [search, setSearch] = useState("");
  const { user, isAdmin, loading, logout } = useAuth();
  
  // Debug user state
  useEffect(() => {
    console.log('User state:', { user: user?.email, isAdmin, loading });
  }, [user, isAdmin, loading]);

  // Show loading while auth is being checked
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Učitavanje...</div>
      </div>
    );
  }

  // inline SVG placeholder (used if the file in /slike is missing)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="192"><rect width="100%" height="100%" fill="#eef2f7"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-size="20" font-family="Arial, Helvetica, sans-serif">Nema slike</text></svg>`;
  const placeholderDataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  
  // Helper to try alternative image names before falling back
  const handleImgError = (e) => {
    const img = e.currentTarget;
    const src = img.getAttribute('src') || '';
    console.warn('Image failed to load:', src);
    img.src = placeholderDataUri;
  };

  // Live competitions from Firestore
  const [natjecanja, setNatjecanja] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'natjecanja'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, 
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('Firestore data loaded:', items);
        setNatjecanja(items);
      }, 
      (err) => {
        console.error('Firestore snapshot error:', err);
        setNatjecanja([]);
      }
    );
    return () => unsub();
  }, []);

  // Filter competitions by year and search
  const filtriranaNatjecanja = natjecanja.filter(n => {
    const byYear = godina ? n.datum?.startsWith(godina) : true;
    const bySearch = search ? n.naziv?.toLowerCase().includes(search.toLowerCase()) : true;
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
        </div>
        <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl font-extrabold text-white whitespace-nowrap tracking-wide transition-all duration-300 hover:scale-110 hover:text-[#36b977] cursor-pointer">
          NATJECANJA
        </h1>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-white text-sm">
                Dobro došli, {user.email} {isAdmin && '(Admin)'}
              </span>
              {isAdmin && (
                <Link href="/kreacija">
                  <button className="bg-[#36b977] text-white font-bold px-3 py-1 rounded hover:bg-[#24995a] transition-colors duration-200">
                    + Kreiraj
                  </button>
                </Link>
              )}
              <button 
                onClick={logout}
                className="bg-white text-[#666] font-bold px-4 py-2 rounded hover:bg-red-500 hover:text-white transition-colors duration-200"
              >
                Odjavi se
              </button>
            </>
          ) : (
            <Link href="/login">
              <button className="bg-white text-[#666] font-bold px-4 py-2 rounded hover:bg-[#36b977] hover:text-white transition-colors duration-200">
                Prijava
              </button>
            </Link>
          )}
          <img
            src="/slike/logo.jpg.png"
            alt="Logo"
            width={64}
            height={64}
            className="rounded border-2 border-gray-300 shadow bg-white"
            onError={handleImgError}
          />
        </div>
      </header>

      <div className="w-full flex justify-center py-4 bg-white gap-4">
        {user && isAdmin && (
          <Link href="/kreacija">
            <button className="bg-[#36b977] text-white font-bold px-6 py-2 rounded hover:bg-[#24995a] transition-colors duration-200">
              Kreiraj natjecanje
            </button>
          </Link>
        )}
        <select
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
          className="border border-gray-300 bg-white text-black rounded px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-green-600 placeholder-gray-500"
        />
      </div>

      {/* Render competitions */}
      <div className="flex flex-col items-center gap-4 py-8 w-full">
        {filtriranaNatjecanja.map(natjecanje => (
          <div key={natjecanje.id} className="w-1/2 min-h-[200px] bg-white rounded-xl shadow-lg p-8 border-2 border-[#36b977] flex flex-col items-start justify-center">
            <img
              src={natjecanje.slika || placeholderDataUri}
              alt={natjecanje.naziv}
              width={600}
              height={192}
              className="w-full h-48 object-cover rounded mb-4 border border-gray-200"
              onError={handleImgError}
              loading="lazy"
              decoding="async"
            />
            <span className="text-2xl font-bold text-[#666] mb-2">{natjecanje.naziv}</span>
            <span className="text-lg text-[#36b977]">Datum: {natjecanje.datum}</span>
            {natjecanje.kategorija && (
              <span className="text-md text-[#666]">Kategorija: {natjecanje.kategorija}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
