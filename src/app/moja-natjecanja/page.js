"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../firebase/config";
import { collection, query, where, onSnapshot, updateDoc, deleteDoc, doc } from "firebase/firestore";
import Sidebar from "../components/Sidebar";
import Swal from 'sweetalert2';

export default function MojaNatjecanja() {
  const { user, loading: authLoading } = useAuth();
  const [natjecanja, setNatjecanja] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // all, draft, pending, published, rejected

  console.log('MojaNatjecanja: Component rendered with:', { 
    user: user?.email || 'null', 
    authLoading, 
    loading, 
    natjecanjaCount: natjecanja.length 
  });

  useEffect(() => {
    console.log('MojaNatjecanja: Auth state:', { user: user?.email, authLoading });
    
    if (!user && !authLoading) {
      console.log('MojaNatjecanja: No user and not loading, redirecting to login');
      window.location.href = '/login';
      return;
    }

    if (!user) {
      console.log('MojaNatjecanja: No user but still loading auth');
      return;
    }

    console.log('MojaNatjecanja: Setting up query for user:', user.email);

    // Debug: Let's also check all competitions to see what createdBy fields look like
    const debugQuery = query(collection(db, 'natjecanja'));
    const debugUnsub = onSnapshot(debugQuery, 
      (snapshot) => {
        console.log('DEBUG: All competitions in database:');
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          console.log(`- ID: ${doc.id}, createdBy: "${data.createdBy}", email match: ${data.createdBy === user.email}`);
        });
      }
    );

    // Load user's competitions
    const q = query(
      collection(db, 'natjecanja'), 
      where('createdBy', '==', user.email)
      // Note: orderBy removed temporarily due to index requirement
    );
    
    const unsub = onSnapshot(q, 
      (snapshot) => {
        console.log('MojaNatjecanja: Raw snapshot received:', snapshot.size, 'documents');
        console.log('MojaNatjecanja: Snapshot docs:', snapshot.docs.map(doc => ({ 
          id: doc.id, 
          data: doc.data() 
        })));
        
        const items = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort on client side
        
        console.log('MojaNatjecanja: Processed items:', items);
        console.log('MojaNatjecanja: User email for comparison:', user.email);
        
        setNatjecanja(items);
        setLoading(false);
      }, 
      (err) => {
        console.error('MojaNatjecanja: Error loading user competitions:', err);
        setNatjecanja([]);
        setLoading(false);
      }
    );
    return () => {
      unsub();
      debugUnsub(); // Clean up debug subscription
    };
  }, [user, authLoading]);

  const handleDelete = async (natjecanje) => {
    const result = await Swal.fire({
      title: 'Obriši natjecanje?',
      html: `
        <p>Želite obrisati natjecanje:</p>
        <p><strong>${natjecanje.naziv}</strong></p>
        <p class="text-red-600"><strong>Ova akcija se ne može poništiti!</strong></p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Da, obriši',
      cancelButtonText: 'Odustani'
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, 'natjecanja', natjecanje.id));

        await Swal.fire({
          icon: 'success',
          title: 'Obrisano!',
          text: 'Natjecanje je uspješno obrisano.',
          timer: 2000,
          showConfirmButton: false
        });

      } catch (error) {
        console.error('Error deleting competition:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Greška',
          text: 'Dogodila se greška prilikom brisanja natjecanja.'
        });
      }
    }
  };

  const handlePublish = async (natjecanje) => {
    const result = await Swal.fire({
      title: 'Pošalji na odobravanje?',
      html: `
        <p>Želite poslati natjecanje na odobravanje:</p>
        <p><strong>${natjecanje.naziv}</strong></p>
        <p class="text-blue-600">Administrator će pregledati vaš zahtjev i odobriti natjecanje za objavu.</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#36b977',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Da, pošalji',
      cancelButtonText: 'Odustani'
    });

    if (result.isConfirmed) {
      try {
        await updateDoc(doc(db, 'natjecanja', natjecanje.id), {
          status: 'pending',
          sentAt: new Date().toISOString(),
          sentBy: user.email
        });

        await Swal.fire({
          icon: 'success',
          title: 'Poslano na odobravanje!',
          html: `
            <p>Natjecanje je uspješno poslano administratoru na odobravanje.</p>
            <p><strong>${natjecanje.naziv}</strong> čeka pregled administratora.</p>
          `,
          timer: 3000,
          showConfirmButton: true,
          confirmButtonText: 'U redu'
        });

      } catch (error) {
        console.error('Error sending competition for approval:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Greška',
          text: 'Dogodila se greška prilikom slanja natjecanja na odobravanje.'
        });
      }
    }
  };

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

  const getStatusBadge = (status) => {
    switch(status) {
      case 'published':
        return (
          <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
            Objavljeno
          </span>
        );
      case 'pending':
        return (
          <span className="px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded-full">
            Čeka odobravanje
          </span>
        );
      case 'rejected':
        return (
          <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-800 rounded-full">
            Odbačeno
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full">
            Draft
          </span>
        );
    }
  };

  const filteredNatjecanja = natjecanja.filter(natjecanje => {
    if (filter === 'all') return true;
    if (filter === 'published') return natjecanje.status === 'published';
    if (filter === 'pending') return natjecanje.status === 'pending';
    if (filter === 'rejected') return natjecanje.status === 'rejected';
    if (filter === 'draft') return natjecanje.status === 'draft' || !natjecanje.status;
    return true;
  });

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Učitavanje...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Header */}
      <header className="sticky top-0 w-full bg-[#666] shadow-md border-b border-gray-200 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <img
              src="/slike/logo.jpg.png"
              alt="Logo"
              width={48}
              height={48}
              className="rounded border-2 border-gray-300 shadow bg-white"
            />
            <div className="flex flex-col">
              <span className="text-base font-bold text-white">
                III. gimnazija, Split
              </span>
              <span className="text-sm text-white">
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
            MOJA NATJECANJA
          </h1>
          
          <Link href="/kreacija">
            <button className="bg-[#36b977] text-white font-bold px-4 py-2 rounded hover:bg-green-600 transition-colors duration-200">
              + Novo natjecanje
            </button>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-6xl mx-auto p-6 lg:ml-80">
        {/* Filter tabs */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Sva natjecanja' },
              { key: 'pending', label: 'Čeka odobravanje' },
              { key: 'published', label: 'Objavljena' },
              { key: 'rejected', label: 'Odbačena' },
              { key: 'draft', label: 'Draft' }
            ].map(tab => {
              let count = 0;
              if (tab.key === 'all') {
                count = natjecanja.length;
              } else if (tab.key === 'pending') {
                count = natjecanja.filter(n => n.status === 'pending').length;
              } else if (tab.key === 'published') {
                count = natjecanja.filter(n => n.status === 'published').length;
              } else if (tab.key === 'rejected') {
                count = natjecanja.filter(n => n.status === 'rejected').length;
              } else if (tab.key === 'draft') {
                count = natjecanja.filter(n => n.status === 'draft' || !n.status).length;
              }

              return (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    filter === tab.key 
                      ? 'bg-[#36b977] text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tab.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-[#36b977]">{natjecanja.length}</div>
            <div className="text-sm text-gray-600">Ukupno natjecanja</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-green-600">{natjecanja.filter(n => n.status === 'published').length}</div>
            <div className="text-sm text-gray-600">Objavljenih</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-yellow-600">{natjecanja.filter(n => n.status === 'draft' || !n.status).length}</div>
            <div className="text-sm text-gray-600">Draft</div>
          </div>
        </div>

        {/* Competitions list */}
        {filteredNatjecanja.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-gray-500 mb-4">
              {filter === 'all' ? (
                <>
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-lg">Nemate kreirana natjecanja</p>
                  <p className="text-sm">Kliknite "Novo natjecanje" da kreirate svoje prvo natjecanje</p>
                </>
              ) : (
                <>
                  <p className="text-lg">
                    Nema {filter === 'published' ? 'objavljenih' : 'draft'} natjecanja
                  </p>
                </>
              )}
            </div>
            {filter === 'all' && (
              <Link href="/kreacija">
                <button className="bg-[#36b977] text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors duration-200">
                  Kreiraj prvo natjecanje
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNatjecanja.map(natjecanje => (
              <div key={natjecanje.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Competition info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {natjecanje.naziv}
                        </h3>
                        {getStatusBadge(natjecanje.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                        <div>
                          <p><strong>Kategorija:</strong> {natjecanje.kategorija}</p>
                          <p><strong>Datum:</strong> {natjecanje.datum}</p>
                        </div>
                        <div>
                          <p><strong>Kreiran:</strong> {new Date(natjecanje.createdAt).toLocaleDateString('hr-HR')}</p>
                          {natjecanje.publishedAt && (
                            <p><strong>Objavljen:</strong> {new Date(natjecanje.publishedAt).toLocaleDateString('hr-HR')}</p>
                          )}
                          {natjecanje.approvedAt && (
                            <p><strong>Odobren:</strong> {new Date(natjecanje.approvedAt).toLocaleDateString('hr-HR')}</p>
                          )}
                          {natjecanje.rejectedAt && (
                            <p><strong>Odbačen:</strong> {new Date(natjecanje.rejectedAt).toLocaleDateString('hr-HR')}</p>
                          )}
                          {natjecanje.rejectionReason && (
                            <p><strong>Razlog:</strong> <span className="text-red-600">{natjecanje.rejectionReason}</span></p>
                          )}
                        </div>
                      </div>
                      
                      {natjecanje.opis && (
                        <p className="text-gray-700 text-sm">{natjecanje.opis}</p>
                      )}
                    </div>

                    {/* Preview */}
                    <div className="flex-shrink-0">
                      <div
                        className="w-32 h-20 rounded border border-gray-200 flex items-center justify-center text-white text-sm font-medium"
                        style={{ 
                          background: natjecanje.gradientStyle || getCategoryGradient(natjecanje.kategorija) 
                        }}
                      >
                        {natjecanje.kategorija}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
                    <Link href={`/natjecanja/${natjecanje.id}`}>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Pregledaj
                      </button>
                    </Link>

                    {/* Gumb za slanje na odobravanje - samo za draft natjecanja */}
                    {natjecanje.status === 'draft' && (
                      <button
                        onClick={() => handlePublish(natjecanje)}
                        className="bg-[#36b977] text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Pošalji na odobravanje
                      </button>
                    )}

                    {/* Gumb za upravljanje prijavama - samo za objavljena natjecanja */}
                    {natjecanje.status === 'published' && (
                      <Link href={`/moja-natjecanja/${natjecanje.id}/prijave`}>
                        <button className="bg-[#36b977] text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Upravljaj prijavama
                        </button>
                      </Link>
                    )}

                    {/* Samo za pending i draft natjecanja možemo obrisati */}
                    {(natjecanje.status === 'pending' || natjecanje.status === 'draft') && (
                      <button
                        onClick={() => handleDelete(natjecanje)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Obriši
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
