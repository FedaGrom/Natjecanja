"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "../../firebase/config";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc, deleteField } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import Sidebar from "../components/Sidebar";
import Swal from 'sweetalert2';

export default function Natjecanja() {
  const router = useRouter();
  const [selected, setSelected] = useState("");
  const [godina, setGodina] = useState("");
  const [search, setSearch] = useState("");
  const [natjecanja, setNatjecanja] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, isAdmin, loading, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  // Close mobile menus when clicking outside
  useEffect(() => {
    if (!isMenuOpen && !isFilterOpen && !isUserMenuOpen) return;
    
    const handleClickOutside = (event) => {
      // Check if click is outside the menus
      const isClickInsideMenu = event.target.closest('.mobile-menu') || event.target.closest('.mobile-filter') || event.target.closest('.user-menu-container');
      if (!isClickInsideMenu) {
        setIsMenuOpen(false);
        setIsFilterOpen(false);
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMenuOpen, isFilterOpen, isUserMenuOpen]);

  // Firestore data loading - get all competitions and filter on client side
  useEffect(() => {
    const q = query(
      collection(db, 'natjecanja'), 
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, 
      (snapshot) => {
        const items = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(item => item.status === 'published'); // Filter on client side
        setNatjecanja(items);
      }, 
      (err) => {
        console.error('Firestore snapshot error:', err);
        setNatjecanja([]);
      }
    );
    return () => unsub();
  }, []);

  // Lock body scroll on mobile while sidebar is open (must be before any early returns to keep hook order stable)
  useEffect(() => {
    const prevOverflow = typeof document !== 'undefined' ? document.body.style.overflow : '';
    if (typeof document !== 'undefined') {
      document.body.style.overflow = isSidebarOpen ? 'hidden' : prevOverflow || '';
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = prevOverflow || '';
      }
    };
  }, [isSidebarOpen]);

  // Show loading while auth is being checked
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Učitavanje...</div>
      </div>
    );
  }

  // Function to handle registration button click
  const handlePrijava = (natjecanje) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('handlePrijava called with:', natjecanje);
      }

      const phase = natjecanje?.phase || 'prijave';
      if (phase !== 'prijave') {
        Swal.fire({
          icon: 'info',
          title: 'Prijave su zatvorene',
          text: phase === 'aktivan' 
            ? 'Događanje je u tijeku, prijave više nisu moguće.'
            : 'Događanje je završilo, prijave nisu moguće.'
        });
        return;
      }
      
      if (natjecanje.tipPrijave === 'custom' && natjecanje.prijavaLink) {
        // Open custom link in new tab
        window.open(natjecanje.prijavaLink, '_blank');
      } else {
        // Redirect to application form
        const url = `/natjecanja/${natjecanje.id}/prijava`;
        if (process.env.NODE_ENV === 'development') {
          console.log('Navigating to:', url);
        }
        
        // Try router.push first, fallback to window.location
        try {
          router.push(url);
        } catch (routerError) {
          console.warn('Router.push failed, using window.location:', routerError);
          window.location.href = url;
        }
      }
    } catch (error) {
      console.error('Error in handlePrijava:', error);
    }
  };

  // Function to get gradient style for category
  const getCategoryGradient = (kategorija) => {
    const categoryGradientMap = {
      SPORT: 'linear-gradient(135deg, #3B82F6, #10B981)',
      'DRUŠTVENE IGRE TURNIR': 'linear-gradient(135deg, #8B5CF6, #EC4899)',
      KVIZOVI: 'linear-gradient(135deg, #F59E0B, #EF4444)',
      GLAZBA: 'linear-gradient(135deg, #EF4444, #F97316)',
      OSTALO: 'linear-gradient(135deg, #6B7280, #9CA3AF)',
    };
    return categoryGradientMap[kategorija] || 'linear-gradient(135deg, #6B7280, #9CA3AF)';
  };

  // Function to delete competition (admin only)
  const handleDeleteNatjecanje = async (id, naziv) => {
    if (!isAdmin) return;
    
    const result = await Swal.fire({
      title: 'Jeste li sigurni?',
      text: `Želite obrisati događanje "${naziv}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Da, obriši!',
      cancelButtonText: 'Odustani'
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, 'natjecanja', id));
        await Swal.fire(
          'Obrisano!',
          'Događanje je uspješno obrisano.',
          'success'
        );
      } catch (error) {
        console.error('Error deleting document:', error);
        await Swal.fire(
          'Greška!',
          'Dogodila se greška prilikom brisanja događanja.',
          'error'
        );
      }
    }
  };

  // Admin-only: merged dialog to set or remove image URL
  const handleSetImageUrl = async (natjecanje) => {
    if (!isAdmin) return;
    const result = await Swal.fire({
      title: 'Uredi sliku',
      input: 'url',
      inputLabel: 'URL slike (https://...)', 
      inputPlaceholder: natjecanje.slika || 'https://example.com/image.jpg',
      inputValue: natjecanje.slika || '',
      showCancelButton: true,
      showDenyButton: !!natjecanje.slika,
      confirmButtonText: 'Spremi',
      denyButtonText: 'Ukloni sliku',
      cancelButtonText: 'Odustani',
      preConfirm: (value) => {
        if (!value) {
          Swal.showValidationMessage('URL je obavezan');
          return false;
        }
        try { new URL(value); } catch {
          Swal.showValidationMessage('Neispravan URL');
          return false;
        }
        return value;
      }
    });

    try {
      if (result.isDenied) {
        await updateDoc(doc(db, 'natjecanja', natjecanje.id), { slika: deleteField() });
        await Swal.fire('Uklonjeno', 'Slika je uklonjena.', 'success');
        return;
      }
      if (result.isConfirmed) {
        const url = result.value;
        await updateDoc(doc(db, 'natjecanja', natjecanje.id), { slika: url });
        await Swal.fire('Spremljeno', 'Slika je dodana/izmijenjena.', 'success');
      }
    } catch (error) {
      console.error('Error updating/removing image URL:', error);
      await Swal.fire('Greška', 'Nije moguće spremiti promjenu.', 'error');
    }
  };

  // Possible competitions (from kreacija page) - also shown in menus
  const mogucaNatjecanja = [
    'SPORT',
    'DRUŠTVENE IGRE TURNIR',
    'KVIZOVI',
    'GLAZBA',
    'OSTALO'
  ];

  // Use only the fixed list of types requested (do not merge with Firestore values)
  const offeredTypes = mogucaNatjecanja;

  // Filter competitions by year, search and type - simple filter without memoization
  const filtriranaNatjecanja = natjecanja.filter(n => {
    const byYear = godina ? n.datum?.startsWith(godina) : true;
    const bySearch = search ? n.naziv?.toLowerCase().includes(search.toLowerCase()) : true;
    const byType = selected ? n.kategorija === selected : true;
    return byYear && bySearch && byType;
  });

  return (
    <div className="min-h-screen bg-white overflow-x-hidden pt-16">
      {/* Dekorativne pozadinske slike */}
      <div aria-hidden="true" className="pointer-events-none">
        {/* Top-right pozadina (iza sadržaja), poravnata uz desni sidebar */}
        <div
          className="hidden md:block absolute top-16 right-0 xl:right-64 z-10 opacity-70"
          style={{
            width: "500px",
            height: "500px",
            backgroundImage: "url(/slike/top.png)",
            backgroundRepeat: "no-repeat",
            backgroundSize: "contain",
            backgroundPosition: "top right",
          }}
        />
        {/* Bottom-left pozadina (fiksirano za dno), poravnata uz lijevi sidebar */}
        <div
          className="fixed bottom-0 left-0 xl:left-80 z-10 opacity-70"
          style={{
            width: "500px",
            height: "500px",
            backgroundImage: "url(/slike/bottom.png)",
            backgroundRepeat: "no-repeat",
            backgroundSize: "contain",
            backgroundPosition: "bottom left",
          }}
        />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 w-full bg-[#666] shadow-md border-b border-gray-200 z-50">
        <div className="flex items-center justify-between px-4 py-2 md:grid md:grid-cols-[1fr,auto,1fr] md:items-center md:gap-4">
          {/* Lijevo - Škola info i logo */}
          <div className="flex items-center gap-3">
            <img
              src="/slike/logo.jpg.png"
              alt="Logo"
              width={48}
              height={48}
              className="rounded border-2 border-gray-300 shadow bg-white"
            />
            <div className="flex flex-col items-start">
              <span className="text-sm md:text-base font-bold text-white leading-tight">
                III. gimnazija, Split
              </span>
              <span className="text-xs md:text-sm text-white leading-tight hidden sm:block">{/* hide tagline on xs */}
                Prirodoslovno-matematička gimnazija
              </span>
            </div>
          </div>

          {/* Sredina - Naslov DOGAĐANJA (samo na desktop) */}
          <h1 className="hidden md:block text-center md:text-2xl lg:text-3xl font-extrabold text-white whitespace-nowrap tracking-wide transition-all duration-300 hover:scale-110 hover:text-[#36b977] md:justify-self-center">
            ŠKOLSKA DOGAĐANJA
          </h1>

          {/* Desno - Botuni/Menu */}
          <div className="flex items-center gap-4 md:justify-self-end">
            {/* Desktop verzija */}
            <div className="hidden xl:flex items-center gap-4">
              {user ? (
                <>
                  <div className="flex items-center gap-2">
                    <Link href="/moja-natjecanja">
                      <button className="bg-blue-600 text-white font-bold px-4 py-2 rounded hover:bg-blue-700 transition-colors duration-200">
                        Moja događanja
                      </button>
                    </Link>
                    <Link href="/kreacija">
                      <button className="bg-[#36b977] text-white font-bold px-4 py-2 rounded hover:bg-green-600 transition-colors duration-200">
                        Kreiraj događanje
                      </button>
                    </Link>
                    {isAdmin && (
                      <Link href="/admin">
                        <button className="bg-[#eab308] text-white font-bold px-4 py-2 rounded hover:bg-[#AA6C39] transition-colors duration-200">
                          Admin panel
                        </button>
                      </Link>
                    )}
                    <button 
                      onClick={logout}
                      className="bg-white text-[#666] font-bold px-4 py-2 rounded hover:bg-red-500 hover:text-white transition-colors duration-200"
                    >
                      Odjavi se
                    </button>
                  </div>
                </>
              ) : (
                <Link href="/login">
                  <button className="bg-white text-[#666] font-bold px-4 py-2 rounded hover:bg-[#36b977] hover:text-white transition-colors duration-200">
                    Prijava
                  </button>
                </Link>
              )}
            </div>

            {/* Mobile / medium verzija - korisnički izbornik u headeru */}
            <div className="flex xl:hidden relative items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsUserMenuOpen((v) => !v);
                }}
                className="bg-white text-[#666] p-2 rounded-lg shadow-lg hover:bg-gray-100 transition-colors duration-200"
                aria-label="Korisnički izbornik"
              >
                {/* User silhouette icon */}
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zM4 20a8 8 0 0116 0v1H4v-1z" />
                </svg>
              </button>
              {isUserMenuOpen && (
                <div className="absolute right-0 top-10 w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-[70] user-menu-container">
                  {user ? (
                    <div className="py-2">
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-gray-900 text-sm">
                        {user.email} {isAdmin && '(Admin)'}
                      </div>
                      <Link href="/moja-natjecanja">
                        <button className="w-full text-left px-4 py-3 text-gray-900 hover:bg-gray-100">Moja događanja</button>
                      </Link>
                      <Link href="/kreacija">
                        <button className="w-full text-left px-4 py-3 text-gray-900 hover:bg-gray-100">Kreiraj događanje</button>
                      </Link>
                      {isAdmin && (
                        <Link href="/admin">
                          <button className="w-full text-left px-4 py-3 text-gray-900 hover:bg-gray-100">Admin panel</button>
                        </Link>
                      )}
                      <button 
                        onClick={() => { logout(); setIsUserMenuOpen(false); }}
                        className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50"
                      >
                        Odjavi se
                      </button>
                    </div>
                  ) : (
                    <Link href="/login">
                      <button className="w-full text-left px-4 py-3 text-gray-900 hover:bg-gray-100">Prijava</button>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobilni naslov ispod headera */}
      <div
        className={`md:hidden fixed top-16 left-0 right-0 bg-white/95 border-b border-gray-200 z-40 ${
          isSidebarOpen ? "hidden" : ""
        }`}
      >
        <div className="px-4 pt-2 pb-3">
          <h1
            className="text-xl font-extrabold text-[#36b977] text-center tracking-wide px-10 py-1 rounded-full border border-[#36b977]/40 shadow-sm bg-white"
          >
            ŠKOLSKA DOGAĐANJA
          </h1>
        </div>
      </div>

      {/* Mobile / medium filter dropdown */}
      <div
        className={`lg:hidden fixed top-28 left-0 right-0 bg-white border-b border-gray-200 z-30 ${
          isSidebarOpen ? "hidden" : ""
        }`}
      >
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="w-full flex items-center justify-between px-4 py-3 text-left font-medium text-gray-700 hover:bg-gray-50"
        >
          <span>Filteri i pretraga</span>
          <svg className={`${isFilterOpen ? 'rotate-180' : ''} w-5 h-5 transition-transform`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isFilterOpen && (
          <div className="mobile-filter px-4 pb-4 space-y-4 bg-gray-50">
            {/* Pretraga */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Pretraži</label>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Pretraži natjecanja..."
                className="w-full border border-gray-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#36b977] placeholder-gray-500 bg-white"
              />
            </div>

            {/* Godina */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Godina</label>
              <select 
                value={godina} 
                onChange={e => setGodina(e.target.value)} 
                className="w-full p-2 border border-gray-200 rounded bg-white"
              >
                <option value="">Sve godine</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
              </select>
            </div>

            {/* Vrsta događanja */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Vrsta događanja</label>
              <select 
                value={selected} 
                onChange={e => setSelected(e.target.value)} 
                className="w-full p-2 border border-gray-200 rounded bg-white"
              >
                <option value="">Sve vrste</option>
                {offeredTypes.map(vrsta => (
                  <option key={vrsta} value={vrsta}>{vrsta}</option>
                ))}
              </select>
            </div>

            {/* Reset botun */}
            <button 
              onClick={() => { 
                setSelected(''); 
                setGodina(''); 
                setSearch(''); 
                setIsFilterOpen(false);
              }} 
              className="w-full bg-[#36b977] text-white p-2 rounded hover:bg-green-600"
            >
              Resetiraj filtere
            </button>
          </div>
        )}
      </div>

      {/* Sidebar (lijevi) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Desktop Right-side filter panel */}
      <aside className="hidden lg:block fixed right-0 top-16 h-[calc(100%-64px)] w-64 p-4 bg-white/90 backdrop-blur-sm border-l border-gray-100 shadow-md overflow-auto z-[60] rounded-l-xl pt-4 transition-all duration-300 pointer-events-auto">
        <div className="sticky top-4">
          <h3 className="text-lg font-bold text-[#36b977] mb-3">Filteri</h3>
        </div>
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-md shadow-sm">
            <label className="block text-sm font-medium text-[#666] mb-1">Pretraži</label>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pretraži događanja..."
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

      {/* Main content area */}
      <div
        className={`w-full ${isFilterOpen ? 'pt-96' : 'pt-32'} md:pt-20 lg:pl-80 lg:pr-64 flex items-center justify-center z-[10]`}
        style={{ minHeight: 'calc(100vh - 6rem)', position: 'relative' }}
      >
        <div className="max-w-4xl w-full mx-auto flex flex-col items-center justify-center gap-6 py-8 px-4">
          {filtriranaNatjecanja.length > 0 ? (
            filtriranaNatjecanja.map(natjecanje => {
              const phase = natjecanje?.phase || 'prijave';
              const prijaveOtvorene = phase === 'prijave';
              return (
                <div 
                  key={natjecanje.id} 
                  className="w-full sm:w-10/12 md:w-9/12 lg:w-11/12 max-w-6xl mx-auto min-h-[240px] bg-white rounded-xl shadow-xl p-6 md:p-10 border-2 border-[#36b977] flex flex-col items-center justify-center text-center relative group hover:shadow-2xl transition-shadow duration-300 pb-16 md:pb-20 lg:pb-20"
                >
                  {/* add bottom padding for mobile to avoid overlap */}
                  {/* Use gradient background instead of image */}
                  <a href={`/natjecanja/${natjecanje.id}`} className="w-full flex justify-center mb-6 block">
                    {natjecanje.slika ? (
                      // Legacy support for existing competitions with images
                      <img
                        src={natjecanje.slika}
                        alt={natjecanje.naziv}
                        width={1000}
                        height={300}
                        className="w-full max-w-full h-48 md:h-64 object-cover rounded border border-gray-200 hover:opacity-90 transition-opacity duration-200"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      // New gradient style for new competitions
                      <div
                        className="w-full max-w-full h-48 md:h-64 rounded border border-gray-200 flex items-center justify-center hover:opacity-90 transition-opacity duration-200"
                        style={{ 
                          background: natjecanje.gradientStyle || getCategoryGradient(natjecanje.kategorija),
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      >
                        <div className="text-center text-white">
                          <div className="text-3xl md:text-4xl font-bold mb-2 drop-shadow-lg">
                            {natjecanje.naziv}
                          </div>
                          <div className="text-lg md:text-xl font-medium drop-shadow-md">
                            {natjecanje.kategorija}
                          </div>
                        </div>
                      </div>
                    )}
                  </a>
                  <a href={`/natjecanja/${natjecanje.id}`} className="inline-block">
                    <h3 className="text-2xl md:text-3xl font-bold text-[#666] mb-3 hover:text-[#36b977] transition-colors duration-200">
                      {natjecanje.naziv}
                    </h3>
                  </a>
                  <span className="text-base md:text-xl text-[#36b977] mb-1">Datum: {natjecanje.datum}</span>
                  {natjecanje.kategorija && (
                    <span className="text-sm md:text-md text-[#666] mb-3">Kategorija: {natjecanje.kategorija}</span>
                  )}
                  {natjecanje.opis && (
                    <p className="text-sm text-gray-600 mb-3 max-w-2xl">{natjecanje.opis}</p>
                  )}

                  {/* Registration button: absolute on md+, stacked block on mobile */}
                  {prijaveOtvorene ? (
                    natjecanje.tipPrijave === 'custom' && natjecanje.prijavaLink ? (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handlePrijava(natjecanje);
                        }}
                        className="md:absolute md:bottom-4 md:right-4 w-full md:w-auto mt-4 md:mt-0 bg-[#36b977] text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center justify-center md:justify-start gap-2 shadow-lg z-10"
                        title="Otvori vanjski link za prijavu"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Prijavi se
                      </button>
                    ) : (
                      <a
                        href={`/natjecanja/${natjecanje.id}/prijava`}
                        onClick={(e) => { e.stopPropagation(); /* allow anchor */ }}
                        className="md:absolute md:bottom-4 md:right-4 w-full md:w-auto mt-4 md:mt-0 bg-[#36b977] text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center justify-center md:justify-start gap-2 shadow-lg z-10 no-underline"
                        title="Prijavi se na događanje"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        Prijavi se
                      </a>
                    )
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="md:absolute md:bottom-4 md:right-4 w-full md:w-auto mt-4 md:mt-0 bg-gray-300 text-gray-600 px-4 py-2 rounded-lg cursor-not-allowed transition-colors duration-200 flex items-center justify-center md:justify-start gap-2 shadow-lg z-10"
                      title="Prijave su zatvorene"
                    >
                      Prijave zatvorene
                    </button>
                  )}
                  
                  {/* Admin controls: single button opens dialog to set/remove image */}
                  {isAdmin && (
                    <div className="md:absolute md:bottom-4 md:left-4 w-full md:w-auto mt-3 md:mt-0 flex flex-col md:flex-row gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteNatjecanje(natjecanje.id, natjecanje.naziv);
                        }}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors duration-200 flex items-center justify-center md:justify-start gap-2 shadow-lg z-10"
                        title="Obriši događanje"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Obriši
                      </button>

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSetImageUrl(natjecanje);
                        }}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center md:justify-start gap-2 shadow-lg z-10"
                        title="Dodaj/uredi URL slike"
                        type="button"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Dodaj URL slike
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">Nema događanja koja odgovaraju vašim filterima.</p>
              <button 
                onClick={() => { setSelected(''); setGodina(''); setSearch(''); }} 
                className="bg-[#36b977] text-white px-6 py-2 rounded hover:bg-green-600 transition-colors duration-200"
              >
                Resetiraj filtere
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
