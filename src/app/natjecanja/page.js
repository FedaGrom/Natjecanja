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
  const [natjecanja, setNatjecanja] = useState([]);
  const { user, isAdmin, loading, logout } = useAuth();
  
  // Debug user state
  useEffect(() => {
    console.log('Natjecanja: User state received:', { 
      user: user?.email || 'null', 
      userExists: !!user,
      isAdmin, 
      loading,
      userObject: user 
    });
  }, [user, isAdmin, loading]);

  // Firestore data loading
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

  // Possible competitions (from kreacija page) - also shown in menus
  const mogucaNatjecanja = [
    'Nogomet', 'Rukomet', 'Košarka', 'Odbojka', 'Tenis', 'Stolni tenis', 'Atletika', 'Plivanje', 'Ragbi', 'Hokej', 'Badminton', 'Skijanje', 'Snowboard', 'Biciklizam', 'Triatlon', 'Fitnes', 'Ples', 'Borilački sportovi (karate, judo, taekwondo)',
    'Matematika', 'Fizika', 'Kemija', 'Biologija', 'Informatika / Programiranje', 'Robotika', 'Astronomija', 'Geografija', 'Povijest', 'Engleski jezik', 'Njemački jezik', 'Latinski', 'Filozofija', 'Ekonomija',
    'Hackathon', 'Web development natjecanje', 'Algoritmičko natjecanje', 'Cyber security / CTF', 'Elektronika / IoT', '3D print natjecanje', 'Dizajn aplikacija',
    'Likovna umjetnost', 'Glazba', 'Dramska igra / Kazalište', 'Fotografija', 'Film / Kratki film', 'Multimedija / Video produkcija', 'Poetika / Pjesništvo', 'Modni dizajn',
    'Šah', 'Debata', 'Esej natjecanje', 'Pravno natjecanje / Moot court', 'Poduzetništvo / Startup pitch', 'Inovacije / STEM projekt', 'Ekološki izazov', 'Kulinarsko natjecanje', 'Robotics League', 'Logika i zagonetke',
    'Orijentacijsko trčanje', 'Planinarenje / Outdoor izazov', 'Stand-up / Komedija', 'Kviz znanja', 'Brainathlon', 'Simulacija UN-a', 'Društvene igre turnir', 'E-sport', 'Gaming turnir',
    'Mladi znanstvenici', 'Debatni klub', 'Model UN', 'Volonterski izazov', 'Mentorship program natjecanje',
    'Talent show', 'Robot wars', 'Karting', 'Auto/moto tehničko natjecanje', 'Građevinski izazov', 'Arhitektonski izazov', 'Dizajn interijera'
  ];

  // Merge types from Firestore and possible list, keep unique and sorted
  const offeredTypes = Array.from(new Set([...(natjecanja.map(n => n.kategorija).filter(Boolean)), ...mogucaNatjecanja]));

  // Filter competitions by year, search and type
  const filtriranaNatjecanja = natjecanja.filter(n => {
    const byYear = godina ? n.datum?.startsWith(godina) : true;
    const bySearch = search ? n.naziv?.toLowerCase().includes(search.toLowerCase()) : true;
    const byType = selected ? n.kategorija === selected : true;
    return byYear && bySearch && byType;
  });

  return (
    <div className="min-h-screen bg-white overflow-x-hidden pt-16">
      {console.log('Natjecanja: About to render with user:', !!user, 'loading:', loading)}
      <header className="fixed top-0 left-0 right-0 w-full flex items-center justify-between px-6 py-2 bg-[#666] shadow-md border-b border-gray-200 z-50">
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

      {/* Left-side types menu (fixed on the left, hidden on small screens) */}
      <aside className="hidden md:block fixed left-0 top-16 h-[calc(100%-64px)] w-64 p-4 bg-white/90 backdrop-blur-sm border-r border-gray-100 shadow-md overflow-auto z-40 rounded-r-xl pt-4 transition-transform duration-300">
        <div className="sticky top-0 bg-white p-3">
          <h3 className="text-lg font-bold text-[#36b977] mb-3">Vrste natjecanja</h3>
        </div>
        <div className="space-y-2">
          <ul className="px-1">
            <li>
              <button onClick={() => setSelected('')} className={`flex w-full items-center justify-start gap-2 text-left px-3 py-2 rounded-md transition-colors duration-200 ${selected === '' ? 'bg-[#36b977] text-white' : 'text-[#333] hover:bg-[#f0fbf6]'}`}>
                Sve vrste
              </button>
            </li>
            {offeredTypes.map(vrsta => (
              <li key={vrsta} className="mt-2">
                <button onClick={() => setSelected(vrsta)} className={`w-full text-left px-2 py-1 rounded ${selected === vrsta ? 'bg-[#36b977] text-white' : 'text-[#666] hover:bg-green-100'}`}>
                  {vrsta}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Right-side filter panel */}
      <aside className="hidden md:block fixed right-0 top-16 h-[calc(100%-64px)] w-64 p-4 bg-white/90 backdrop-blur-sm border-l border-gray-100 shadow-md overflow-auto z-40 rounded-l-xl pt-4 transition-all duration-300">
        <div className="sticky top-4">
          <h3 className="text-lg font-bold text-[#36b977] mb-3">Filteri</h3>
        </div>
        <div className="space-y-4">
          {user && isAdmin && (
            <div>
              <Link href="/kreacija">
                <button className="w-full bg-[#36b977] text-white p-2 rounded mb-2 transition-shadow hover:shadow-lg">Kreiraj natjecanje</button>
              </Link>
            </div>
          )}
          <div className="p-3 bg-gray-50 rounded-md shadow-sm">
            <label className="block text-sm font-medium text-[#666] mb-1">Pretraži</label>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pretraži natjecanja..."
              className="w-full border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#36b977] placeholder-gray-500 bg-white/80"
            />
          </div>
          <div className="p-3 bg-gray-50 rounded-md shadow-sm">
            <label className="block text-sm font-medium text-[#666] mb-1">Godina</label>
            <select value={godina} onChange={e => setGodina(e.target.value)} className="w-full p-2 border border-gray-200 rounded bg-white/80">
              <option value="">Sve godine</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>
          </div>
          <div className="p-3 bg-gray-50 rounded-md shadow-sm">
            <label className="block text-sm font-medium text-[#666] mb-1">Odaberi vrstu</label>
            <div className="flex flex-col gap-2 max-h-40 overflow-auto">
              <button onClick={() => setSelected('')} className={`text-left px-2 py-1 rounded ${selected === '' ? 'bg-[#36b977] text-white' : 'text-[#333] hover:bg-[#f0fbf6]'}`}>
                Sve vrste
              </button>
              {offeredTypes.map(vrsta => (
                <button key={vrsta} onClick={() => setSelected(vrsta)} className={`text-left px-2 py-1 rounded ${selected === vrsta ? 'bg-[#36b977] text-white' : 'text-[#333] hover:bg-[#f0fbf6]'}`}>
                  {vrsta}
                </button>
              ))}
            </div>
          </div>
          <div>
            <button onClick={() => { setSelected(''); setGodina(''); setSearch(''); }} className="w-full bg-[#36b977] text-white p-2 rounded hover:opacity-95">Resetiraj filtere</button>
          </div>
        </div>
      </aside>

      <div className="w-full py-4 bg-white"></div>
      {/* Render competitions as large rectangles */}
      <div className="flex flex-col items-center gap-6 py-8 w-full md:ml-64 md:mr-64">
        {filtriranaNatjecanja.map(natjecanje => (
          <div key={natjecanje.id} className="w-full max-w-3xl mx-auto min-h-[180px] bg-white rounded-xl shadow-lg p-6 md:p-8 border-2 border-[#36b977] flex flex-col items-start justify-center">
            {/* Use native img with fallback for placeholder */}
            <div className="w-full flex justify-center mb-4">
              <img
                src={natjecanje.slika || placeholderDataUri}
                alt={natjecanje.naziv}
                width={800}
                height={240}
                className="w-full max-w-full h-48 md:h-52 object-cover rounded border border-gray-200"
                onError={handleImgError}
                loading="lazy"
                decoding="async"
              />
            </div>
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
