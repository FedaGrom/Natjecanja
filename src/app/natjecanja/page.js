"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import Swal from 'sweetalert2';

export default function Natjecanja() {
  const [selected, setSelected] = useState("");
  const [godina, setGodina] = useState("");
  const [search, setSearch] = useState("");
  const [natjecanja, setNatjecanja] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
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

  // Close mobile menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen || isFilterOpen) {
        // Check if click is outside the menus
        const isClickInsideMenu = event.target.closest('.mobile-menu') || event.target.closest('.mobile-filter');
        if (!isClickInsideMenu) {
          setIsMenuOpen(false);
          setIsFilterOpen(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMenuOpen, isFilterOpen]);

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

  // Function to handle registration button click
  const handlePrijava = (natjecanje) => {
    if (natjecanje.tipPrijave === 'custom' && natjecanje.prijavaLink) {
      // Open custom link in new tab
      window.open(natjecanje.prijavaLink, '_blank');
    } else {
      // Default behavior - could be internal registration system
      alert('Funkcionalnost prijave će biti implementirana uskoro.');
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
      text: `Želite obrisati natjecanje "${naziv}"?`,
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
          'Natjecanje je uspješno obrisano.',
          'success'
        );
      } catch (error) {
        console.error('Error deleting document:', error);
        await Swal.fire(
          'Greška!',
          'Dogodila se greška prilikom brisanja natjecanja.',
          'error'
        );
      }
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

  // Left-side specific list for now
  const lijevaNatjecanja = [
    'Mioc Open',
    'Mioc Klozed',
    'Pub Quiz',
    'Briškula i Trešeta turnir'
  ];

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
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 w-full bg-[#666] shadow-md border-b border-gray-200 z-50">
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
            <div className="flex flex-col items-start">
              <span className="text-sm md:text-base font-bold text-white leading-tight">
                III. gimnazija, Split
              </span>
              <span className="text-xs md:text-sm text-white leading-tight hidden sm:block">
                Prirodoslovno-matematička gimnazija
              </span>
            </div>
          </div>

          {/* Sredina - Naslov NATJECANJA (samo na desktop) */}
          <h1 className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl lg:text-3xl font-extrabold text-white whitespace-nowrap tracking-wide transition-all duration-300 hover:scale-110 hover:text-[#36b977] cursor-pointer">
            NATJECANJA
          </h1>

          {/* Desno - Botuni/Menu */}
          <div className="flex items-center gap-4">
            {/* Desktop verzija */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-white text-sm">
                    Dobro došli, {user.email} {isAdmin && '(Admin)'}
                  </span>
                  {isAdmin && (
                    <Link href="/kreacija">
                      <button className="bg-[#36b977] text-white font-bold px-4 py-2 rounded hover:bg-green-600 transition-colors duration-200">
                        Kreiraj natjecanje
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
            </div>

            {/* Mobile hamburger */}
            <div className="md:hidden">
              {user ? (
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="bg-white text-[#666] p-2 rounded hover:bg-[#36b977] hover:text-white transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              ) : (
                <Link href="/login">
                  <button className="bg-white text-[#666] font-bold px-4 py-2 rounded hover:bg-[#36b977] hover:text-white transition-colors duration-200">
                    Prijava
                  </button>
                </Link>
              )}
              
              {/* Mobile dropdown menu */}
              {isMenuOpen && user && (
                <div className="mobile-menu absolute right-4 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[200px]">
                  <div className="p-4 border-b border-gray-200">
                    <span className="text-sm text-gray-600">
                      {user.email} {isAdmin && '(Admin)'}
                    </span>
                  </div>
                  {isAdmin && (
                    <Link href="/kreacija">
                      <button 
                        onClick={() => setIsMenuOpen(false)}
                        className="w-full text-left px-4 py-3 text-gray-700 hover:bg-[#36b977] hover:text-white transition-colors duration-200"
                      >
                        Kreiraj natjecanje
                      </button>
                    </Link>
                  )}
                  <button 
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-500 hover:text-white transition-colors duration-200"
                  >
                    Odjavi se
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobilni naslov ispod headera */}
      <div className="md:hidden fixed top-16 left-0 right-0 bg-white border-b border-gray-200 z-40 pt-10">
        <h1 className="text-2xl font-extrabold text-[#36b977] text-center tracking-wide">
          NATJECANJA
        </h1>
      </div>

      {/* Mobile filter dropdown */}
      <div className="md:hidden fixed top-28 left-0 right-0 bg-white border-b border-gray-200 z-30 pt-10">
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="w-full flex items-center justify-between px-4 py-3 text-left font-medium text-gray-700 hover:bg-gray-50"
        >
          <span>Filteri i pretraga</span>
          <svg className={`w-5 h-5 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

            {/* Vrsta natjecanja */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Vrsta natjecanja</label>
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

      {/* Desktop Left-side types menu */}
      <aside className="hidden lg:block fixed left-0 top-16 h-[calc(100%-64px)] w-64 p-4 bg-white/90 backdrop-blur-sm border-r border-gray-100 shadow-md overflow-auto z-20 rounded-r-xl pt-4 transition-transform duration-300">
        <div className="sticky top-0 bg-white p-3">
          <h3 className="text-lg font-bold text-[#36b977] mb-3">Natjecanja</h3>
        </div>
        <div className="space-y-2">
          <ul className="px-1">
            <li>
              <button onClick={() => setSelected('')} className={`flex w-full items-center justify-start gap-2 text-left px-3 py-2 rounded-md transition-colors duration-200 ${selected === '' ? 'bg-[#36b977] text-white' : 'text-[#333] hover:bg-[#f0fbf6]'}`}>
                Sve
              </button>
            </li>
            {lijevaNatjecanja.map(vrsta => (
              <li key={vrsta} className="mt-2">
                <button onClick={() => setSelected(vrsta)} className={`w-full text-left px-2 py-1 rounded ${selected === vrsta ? 'bg-[#36b977] text-white' : 'text-[#666] hover:bg-green-100'}`}>
                  {vrsta}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Desktop Right-side filter panel */}
      <aside className="hidden lg:block fixed right-0 top-16 h-[calc(100%-64px)] w-64 p-4 bg-white/90 backdrop-blur-sm border-l border-gray-100 shadow-md overflow-auto z-20 rounded-l-xl pt-4 transition-all duration-300">
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

      {/* Main content area */}
      <div
        className={`w-full ${isFilterOpen ? 'pt-96' : 'pt-32'} md:pt-20 lg:w-[calc(100%-32rem)] lg:mx-auto flex items-center justify-center`}
        style={{ minHeight: 'calc(100vh - 6rem)' }}
      >
        <div className="max-w-4xl w-full mx-auto flex flex-col items-center justify-center gap-6 py-8 px-4">
          {filtriranaNatjecanja.length > 0 ? (
            filtriranaNatjecanja.map(natjecanje => (
              <div key={natjecanje.id} className="w-full sm:w-10/12 md:w-9/12 lg:w-11/12 max-w-6xl mx-auto min-h-[240px] bg-white rounded-xl shadow-xl p-6 md:p-10 border-2 border-[#36b977] flex flex-col items-center justify-center text-center relative group hover:shadow-2xl transition-shadow duration-300">
                {/* Use gradient background instead of image */}
                <Link href={`/natjecanja/${natjecanje.id}`} className="w-full flex justify-center mb-6 cursor-pointer">
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
                          {natjecanje.kategorija}
                        </div>
                        <div className="text-lg md:text-xl font-medium drop-shadow-md">
                          {natjecanje.naziv}
                        </div>
                      </div>
                    </div>
                  )}
                </Link>
                <Link href={`/natjecanja/${natjecanje.id}`}>
                  <span className="text-2xl md:text-3xl font-bold text-[#666] mb-3 cursor-pointer hover:text-[#36b977] transition-colors duration-200">
                    {natjecanje.naziv}
                  </span>
                </Link>
                <span className="text-base md:text-xl text-[#36b977] mb-1">Datum: {natjecanje.datum}</span>
                {natjecanje.kategorija && (
                  <span className="text-sm md:text-md text-[#666] mb-3">Kategorija: {natjecanje.kategorija}</span>
                )}
                {natjecanje.opis && (
                  <p className="text-sm text-gray-600 mb-3 max-w-2xl">{natjecanje.opis}</p>
                )}

                {/* Registration button in bottom right corner */}
                <button
                  onClick={() => handlePrijava(natjecanje)}
                  className="absolute bottom-4 right-4 bg-[#36b977] text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center gap-2 shadow-lg"
                  title={natjecanje.tipPrijave === 'custom' && natjecanje.prijavaLink ? 'Otvori vanjski link za prijavu' : 'Prijavi se na natjecanje'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {natjecanje.tipPrijave === 'custom' && natjecanje.prijavaLink ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    )}
                  </svg>
                  {natjecanje.tipPrijave === 'custom' && natjecanje.prijavaLink ? 'Prijavi se' : 'Prijavi se'}
                </button>
                
                {/* Admin controls */}
                {isAdmin && (
                  <div className="absolute bottom-4 left-4 flex gap-2">
                    <button
                      onClick={() => handleDeleteNatjecanje(natjecanje.id, natjecanje.naziv)}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors duration-200 flex items-center gap-2 shadow-lg"
                      title="Obriši natjecanje"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Obriši
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg mb-4">Nema natjecanja koja odgovaraju vašim filterima.</p>
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
