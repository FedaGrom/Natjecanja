"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "../../firebase/config";
import { collection, addDoc } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";

export default function KreacijaNatjecanja() {
  const [naziv, setNaziv] = useState("");
  const [datum, setDatum] = useState("");
  const [kategorija, setKategorija] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Show loading while auth is being checked
  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Učitavanje...</div>;
  }

  // Don't render if not authenticated
  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Preusmjeravanje na prijavu...</div>;
  }

  // inline SVG placeholder and image error handler
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="192"><rect width="100%" height="100%" fill="#eef2f7"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-size="20" font-family="Arial, Helvetica, sans-serif">Nema slike</text></svg>`;
  const placeholderDataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  const handleImgError = (e) => { const img = e.currentTarget; const src = img.getAttribute('src') || ''; console.warn('Image failed to load:', src); if (!img.dataset.fallbackTried) { img.dataset.fallbackTried = '1'; if (src.endsWith('.jpg.png')) { img.src = src.replace('.jpg.png', '.jpg'); return; } if (src.endsWith('.png.jpg')) { img.src = src.replace('.png.jpg', '.png'); return; } if (src.endsWith('.jpg')) { img.src = src.replace(/\.jpg$/, '.png'); return; } if (src.endsWith('.png')) { img.src = src.replace(/\.png$/, '.jpg'); return; } }
    if (!img.dataset.triedNoSlash && src.startsWith('/')) { img.dataset.triedNoSlash = '1'; img.src = src.replace(/^\//, ''); return; }
    if (!img.dataset.triedLower) { img.dataset.triedLower = '1'; img.src = src.toLowerCase(); return; }
    img.src = placeholderDataUri; };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted with:', { naziv, datum, kategorija });
    setLoading(true);
    try {
      // Map selected category to an image filename (place files later in /slike)
      const categoryImageMap = {
        Sport: '/slike/sport.jpg',
        Academic: '/slike/academic.jpg',
        STEM: '/slike/stem.jpg',
        Arts: '/slike/arts.jpg',
        Other: '/slike/placeholder.jpg',
      };
      const imageUrl = kategorija ? (categoryImageMap[kategorija] || `/slike/${kategorija.toLowerCase().replace(/\s+/g,'_')}.jpg`) : null;
      
      const docData = {
        naziv,
        datum,
        kategorija,
        slika: imageUrl || null,
        createdAt: new Date(),
      };
      console.log('Attempting to save to Firestore:', docData);
      
      // Save document in Firestore
      const docRef = await addDoc(collection(db, 'natjecanja'), docData);
      console.log('Document saved with ID:', docRef.id);
      
      alert('Natjecanje spremljeno (ID: ' + docRef.id + ')');
      setNaziv("");
      setDatum("");
      setKategorija("");
    } catch (err) {
      console.error('Detailed error:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      
      // If Firestore is not set up, save locally for now
      if (err.code === 'unavailable' || err.message.includes('400')) {
        console.warn('Firestore not available, saving to localStorage as fallback');
        const natjecanja = JSON.parse(localStorage.getItem('natjecanja') || '[]');
        const newNatjecanje = {
          id: Date.now().toString(),
          naziv,
          datum,
          kategorija,
          slika: imageUrl || null,
          createdAt: new Date(),
        };
        natjecanja.push(newNatjecanje);
        localStorage.setItem('natjecanja', JSON.stringify(natjecanja));
        alert('Natjecanje spremljeno lokalno (Firestore nije dostupan)');
        setNaziv("");
        setDatum("");
        setKategorija("");
      } else {
        alert('Pogreška: ' + (err.message || 'Nepoznata greška') + '\n\nMolimo postavite Firestore Database u Firebase Console.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Long list of possible competitions
  const mogucaNatjecanja = [
    // Sports
    'Nogomet', 'Rukomet', 'Košarka', 'Odbojka', 'Tenis', 'Stolni tenis', 'Atletika', 'Plivanje', 'Ragbi', 'Hokej', 'Badminton', 'Skijanje', 'Snowboard', 'Biciklizam', 'Triatlon', 'Fitnes', 'Ples', 'Borilački sportovi (karate, judo, taekwondo)',
    // Academic
    'Matematika', 'Fizika', 'Kemija', 'Biologija', 'Informatika / Programiranje', 'Robotika', 'Astronomija', 'Geografija', 'Povijest', 'Engleski jezik', 'Njemački jezik', 'Latinski', 'Filozofija', 'Ekonomija',
    // STEM / Tech
    'Hackathon', 'Web development natjecanje', 'Algoritmičko natjecanje', 'Cyber security / CTF', 'Elektronika / IoT', '3D print natjecanje', 'Dizajn aplikacija',
    // Arts & culture
    'Likovna umjetnost', 'Glazba', 'Dramska igra / Kazalište', 'Fotografija', 'Film / Kratki film', 'Multimedija / Video produkcija', 'Poetika / Pjesništvo', 'Modni dizajn',
    // Others
    'Šah', 'Debata', 'Esej natjecanje', 'Pravno natjecanje / Moot court', 'Poduzetništvo / Startup pitch', 'Inovacije / STEM projekt', 'Ekološki izazov', 'Kulinarsko natjecanje', 'Robotics League', 'Logika i zagonetke',
    'Orijentacijsko trčanje', 'Planinarenje / Outdoor izazov', 'Stand-up / Komedija', 'Kviz znanja', 'Brainathlon', 'Simulacija UN-a', 'Društvene igre turnir', 'E-sport', 'Gaming turnir',
    // Educational clubs
    'Mladi znanstvenici', 'Debatni klub', 'Model UN', 'Volonterski izazov', 'Mentorship program natjecanje',
    // Misc
    'Talent show', 'Robot wars', 'Karting', 'Auto/moto tehničko natjecanje', 'Građevinski izazov', 'Arhitektonski izazov', 'Dizajn interijera'
  ];

  return (
    <>
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
          <Link href="/natjecanja">
            <button className="bg-white text-[#666] font-bold px-4 py-2 rounded hover:bg-[#36b977] hover:text-white transition-colors duration-200">
              Natrag
            </button>
          </Link>
        </div>
        <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl font-extrabold text-white whitespace-nowrap tracking-wide transition-all duration-300 hover:scale-110 hover:text-[#36b977] cursor-pointer">
          Kreiraj natjecanje
        </h1>
        <div className="flex items-center gap-4">
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
      <div className="w-full flex flex-col items-center mt-12 bg-white">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 w-full max-w-md bg-gray-50 p-8 rounded-xl shadow"
        >
          <label className="font-bold text-[#666]">Naziv natjecanja:</label>
          <input
            type="text"
            value={naziv}
            onChange={(e) => setNaziv(e.target.value)}
            className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#36b977]"
            required
          />
          <label className="font-bold text-[#666]">Datum:</label>
          <input
            type="date"
            value={datum}
            onChange={(e) => setDatum(e.target.value)}
            className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#36b977]"
            required
          />
          <label className="font-bold text-[#666]">Kategorija:</label>
          <select
            value={kategorija}
            onChange={e => setKategorija(e.target.value)}
            className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#36b977]"
          >
            <option value="">-- Odaberite kategoriju --</option>
            <option value="Sport">Sport</option>
            <option value="Academic">Akademsko</option>
            <option value="STEM">STEM / Tehnologija</option>
            <option value="Arts">Umjetnost / Kultura</option>
            <option value="Other">Ostalo</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="bg-[#36b977] disabled:opacity-50 text-white font-bold px-4 py-2 rounded hover:bg-[#24995a] transition-colors duration-200"
          >
            {loading ? 'Spremanje...' : 'Spremi'}
          </button>
        </form>
      </div>
      <div className="w-full flex flex-col items-center mt-8 bg-white">
        <div className="w-full max-w-3xl bg-gray-50 p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold text-[#666] mb-4">Moguća natjecanja (primjeri)</h2>
          <ul className="grid grid-cols-2 gap-2 list-disc list-inside text-sm text-gray-700">
            {mogucaNatjecanja.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
