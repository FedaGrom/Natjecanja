"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "../../firebase/config";
import { collection, addDoc } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import Swal from 'sweetalert2';

export default function KreacijaNatjecanja() {
  const [naziv, setNaziv] = useState("");
  const [datum, setDatum] = useState("");
  const [kategorija, setKategorija] = useState("");
  const [customKategorija, setCustomKategorija] = useState("");
  const [opis, setOpis] = useState("");
  const [tipPrijave, setTipPrijave] = useState("web");
  const [customPrijavaLink, setCustomPrijavaLink] = useState("");
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
    
    // Determine final category - use custom if "OSTALO" is selected
    const finalKategorija = kategorija === 'OSTALO' ? customKategorija : kategorija;
    
    console.log('Form submitted with:', { naziv, datum, kategorija: finalKategorija });
    setLoading(true);
    try {
      // Map selected category to gradient colors instead of images
      const categoryGradientMap = {
        SPORT: 'linear-gradient(135deg, #3B82F6, #10B981)',
        'DRUŠTVENE IGRE TURNIR': 'linear-gradient(135deg, #8B5CF6, #EC4899)',
        KVIZOVI: 'linear-gradient(135deg, #F59E0B, #EF4444)',
        GLAZBA: 'linear-gradient(135deg, #EF4444, #F97316)',
        OSTALO: 'linear-gradient(135deg, #6B7280, #9CA3AF)',
      };
      
      // For OSTALO category, always use placeholder gradient regardless of custom text
      const gradientStyle = kategorija === 'OSTALO' ? categoryGradientMap.OSTALO : categoryGradientMap[kategorija];
      
      const docData = {
        naziv,
        datum,
        kategorija: finalKategorija,
        opis: opis.trim() || null,
        tipPrijave,
        prijavaLink: tipPrijave === 'custom' ? customPrijavaLink : null,
        gradientStyle: gradientStyle || null,
        createdAt: new Date().toISOString(),
        createdBy: user.email,
        status: 'pending', // Nova natjecanja čekaju odobravanje admina
        timestamp: Date.now()
      };
      console.log('Attempting to save to Firestore:', docData);
      
      // Save document in Firestore
      const docRef = await addDoc(collection(db, 'natjecanja'), docData);
      console.log('Document saved with ID:', docRef.id);
      
      // Show success popup with options
      const result = await Swal.fire({
        icon: 'success',
        title: 'Zahtjev poslan!',
        html: `
          <p>Zahtjev za natjecanje "${naziv}" je uspješno poslan administratoru.</p>
          <p><small>Administrator će pregledati i odobriti vaš zahtjev.</small></p>
        `,
        showCancelButton: true,
        confirmButtonText: 'Idi na moja natjecanja',
        cancelButtonText: 'Kreiraj novo natjecanje',
        confirmButtonColor: '#36b977',
        cancelButtonColor: '#6b7280'
      });
      
      if (result.isConfirmed) {
        router.push("/moja-natjecanja");
      } else {
        // Reset form for new competition
        setNaziv("");
        setDatum("");
        setKategorija("");
        setCustomKategorija("");
        setOpis("");
        setTipPrijave("web");
        setCustomPrijavaLink("");
      }
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
          opis: opis.trim() || null,
          tipPrijave,
          prijavaLink: tipPrijave === 'custom' ? customPrijavaLink : null,
          gradientStyle: gradientStyle || null,
          createdAt: new Date(),
        };
        natjecanja.push(newNatjecanje);
        localStorage.setItem('natjecanja', JSON.stringify(natjecanja));
        
        await Swal.fire({
          icon: 'warning',
          title: 'Spremljeno lokalno',
          text: 'Firestore nije dostupan, natjecanje je spremljeno lokalno',
          timer: 3000,
          showConfirmButton: false
        });
        
        router.push("/natjecanja");
        setNaziv("");
        setDatum("");
        setKategorija("");
        setCustomKategorija("");
        setOpis("");
        setTipPrijave("web");
        setCustomPrijavaLink("");
        setCustomKategorija("");
        setOpis("");
        setTipPrijave("web");
        setCustomPrijavaLink("");
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'Greška!',
          text: (err.message || 'Nepoznata greška') + '\n\nMolimo postavite Firestore Database u Firebase Console.',
          confirmButtonText: 'U redu'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Simplified list of competition categories
  const mogucaNatjecanja = [
    'SPORT',
    'DRUŠTVENE IGRE TURNIR',
    'KVIZOVI',
    'GLAZBA',
    'OSTALO'
  ];

  return (
    <>
      <header className="sticky top-0 w-full flex items-center justify-between px-6 py-2 bg-[#666] shadow-md border-b border-gray-200 z-50">
        <div className="flex items-center gap-4">
          <img
            src="/slike/logo.jpg.png"
            alt="Logo"
            width={48}
            height={48}
            className="rounded border-2 border-gray-300 shadow bg-white"
          />
          <div className="flex flex-col items-start mr-4">
            <span className="text-base font-bold text-white leading-tight">
              III. gimnazija, Split
            </span>
            <span className="text-sm text-white leading-tight">
              Prirodoslovno-matematička gimnazija
            </span>
          </div>
          <Link href="/natjecanja">
            <button className="bg-white text-[#666] font-bold px-4 py-2 rounded hover:bg-[#36b977] hover:text-white transition-colors duration-200 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
              </svg>
              Početna
            </button>
          </Link>
        </div>
        <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl lg:text-3xl font-extrabold text-white whitespace-nowrap tracking-wide transition-all duration-300 hover:scale-110 hover:text-[#36b977] cursor-pointer">
          KREIRAJ NATJECANJE
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
            className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#36b977] text-gray-900 bg-white"
            required
          />
          <label className="font-bold text-[#666]">Datum:</label>
          <input
            type="date"
            value={datum}
            onChange={(e) => setDatum(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#36b977] text-gray-900 bg-white"
            required
          />
          <label className="font-bold text-[#666]">Kategorija:</label>
          <select
            value={kategorija}
            onChange={e => setKategorija(e.target.value)}
            className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#36b977] text-gray-900 bg-white"
            required
          >
            <option value="">-- Odaberite kategoriju --</option>
            {mogucaNatjecanja.map((m, i) => (
              <option key={i} value={m}>{m}</option>
            ))}
          </select>
          
          {kategorija === 'OSTALO' && (
            <>
              <label className="font-bold text-[#666]">Specificiraj kategoriju:</label>
              <input
                type="text"
                value={customKategorija}
                onChange={(e) => setCustomKategorija(e.target.value)}
                placeholder="Unesite naziv kategorije..."
                className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#36b977] text-gray-900 bg-white"
                required
              />
            </>
          )}

          <label className="font-bold text-[#666]">Opis natjecanja (opcionalno):</label>
          <textarea
            value={opis}
            onChange={(e) => setOpis(e.target.value)}
            placeholder="Kratki opis natjecanja..."
            className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#36b977] text-gray-900 bg-white resize-vertical min-h-[80px]"
            rows={3}
          />

          <label className="font-bold text-[#666]">Način prijave:</label>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="tipPrijave"
                value="web"
                checked={tipPrijave === 'web'}
                onChange={(e) => setTipPrijave(e.target.value)}
                className="text-[#36b977] focus:ring-[#36b977]"
              />
              <span>Prijave na ovoj web stranici</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="tipPrijave"
                value="custom"
                checked={tipPrijave === 'custom'}
                onChange={(e) => setTipPrijave(e.target.value)}
                className="text-[#36b977] focus:ring-[#36b977]"
              />
              <span>Custom link za prijavu</span>
            </label>
          </div>

          {tipPrijave === 'custom' && (
            <>
              <label className="font-bold text-[#666]">Link za prijavu:</label>
              <input
                type="url"
                value={customPrijavaLink}
                onChange={(e) => setCustomPrijavaLink(e.target.value)}
                placeholder="https://example.com/prijava"
                className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#36b977] text-gray-900 bg-white"
                required
              />
            </>
          )}
          
          <button
            type="submit"
            disabled={loading || (kategorija === 'OSTALO' && !customKategorija.trim()) || (tipPrijave === 'custom' && !customPrijavaLink.trim())}
            className="bg-[#36b977] disabled:opacity-50 text-white font-bold px-4 py-2 rounded hover:bg-[#24995a] transition-colors duration-200"
          >
            {loading ? 'Spremanje...' : 'Spremi'}
          </button>
        </form>
      </div>
    </>
  );
}
