"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../../firebase/config";
import { doc, getDoc, collection, query, where, orderBy, onSnapshot, updateDoc, deleteDoc } from "firebase/firestore";
import { useAuth } from "../../../../contexts/AuthContext";
import Swal from 'sweetalert2';

export default function UpravljajPrijavama() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [natjecanje, setNatjecanje] = useState(null);
  const [prijave, setPrijave] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all

  // Load competition data and check if user is the creator
  useEffect(() => {
    const loadNatjecanje = async () => {
      if (!id) return;
      
      try {
        const docRef = doc(db, 'natjecanja', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setNatjecanje(data);
          
          // Check if current user is the creator
          if (user && data.createdBy !== user.email) {
            await Swal.fire({
              icon: 'error',
              title: 'Nemate dozvolu',
              text: 'Možete upravljati samo prijavama za natjecanja koja ste vi kreirali.',
              confirmButtonText: 'U redu'
            });
            router.push('/moja-natjecanja');
            return;
          }
        } else {
          console.log('No such document!');
          router.push('/moja-natjecanja');
          return;
        }
      } catch (error) {
        console.error('Error loading natjecanje:', error);
        router.push('/moja-natjecanja');
        return;
      } finally {
        setLoading(false);
      }
    };

    if (user && !authLoading) {
      loadNatjecanje();
    }
  }, [id, user, authLoading, router]);

  // Load applications for this competition
  useEffect(() => {
    if (!id || !user) return;

    const q = query(
      collection(db, 'prijave'),
      where('natjecanjeId', '==', id),
      orderBy('createdAt', 'desc')
    );
    
    const unsub = onSnapshot(q, 
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('Applications loaded for competition:', items);
        setPrijave(items);
        setLoadingApplications(false);
      }, 
      (err) => {
        console.error('Error loading applications:', err);
        setPrijave([]);
        setLoadingApplications(false);
      }
    );
    return () => unsub();
  }, [id, user]);

  const handleApprove = async (prijava) => {
    const result = await Swal.fire({
      title: 'Odobri prijavu?',
      html: `
        <p>Odobravate prijavu za:</p>
        <p><strong>${prijava.ime} ${prijava.prezime}</strong></p>
        <p><strong>Email:</strong> ${prijava.email}</p>
        <p><strong>Natjecanje:</strong> ${prijava.natjecanjeNaziv}</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#36b977',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Da, odobri',
      cancelButtonText: 'Odustani'
    });

    if (result.isConfirmed) {
      try {
        await updateDoc(doc(db, 'prijave', prijava.id), {
          status: 'approved',
          approvedAt: new Date().toISOString(),
          approvedBy: user.email
        });

        await Swal.fire({
          icon: 'success',
          title: 'Prijava odobrena!',
          html: `
            <p>Prijava je uspješno odobrena.</p>
            <p><small><strong>Važno:</strong> Obavijestite korisnika putem email-a o odobrenju prijave na natjecanje.</small></p>
          `,
          confirmButtonText: 'U redu'
        });

      } catch (error) {
        console.error('Error approving application:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Greška',
          text: 'Dogodila se greška prilikom odobravanja prijave.'
        });
      }
    }
  };

  const handleReject = async (prijava) => {
    const result = await Swal.fire({
      title: 'Odbaci prijavu?',
      html: `
        <p>Odbacujete prijavu za:</p>
        <p><strong>${prijava.ime} ${prijava.prezime}</strong></p>
        <p><strong>Email:</strong> ${prijava.email}</p>
      `,
      icon: 'warning',
      input: 'textarea',
      inputPlaceholder: 'Razlog odbacivanja (opcionalno)',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Da, odbaci',
      cancelButtonText: 'Odustani'
    });

    if (result.isConfirmed) {
      try {
        await updateDoc(doc(db, 'prijave', prijava.id), {
          status: 'rejected',
          rejectedAt: new Date().toISOString(),
          rejectionReason: result.value || '',
          rejectedBy: user.email
        });

        await Swal.fire({
          icon: 'success',
          title: 'Prijava odbačena',
          html: `
            <p>Prijava je uspješno odbačena.</p>
            <p><small>Ne zaboravite obavijestiti korisnika o odbacivanju prijave putem email-a.</small></p>
          `,
          timer: 3000,
          showConfirmButton: true,
          confirmButtonText: 'U redu'
        });

      } catch (error) {
        console.error('Error rejecting application:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Greška',
          text: 'Dogodila se greška prilikom odbacivanja prijave.'
        });
      }
    }
  };

  const handleDelete = async (prijava) => {
    const result = await Swal.fire({
      title: 'Obriši prijavu?',
      html: `
        <p>Brisanje prijave za:</p>
        <p><strong>${prijava.ime} ${prijava.prezime}</strong></p>
        <p><strong>Email:</strong> ${prijava.email}</p>
        <p><small>Ova akcija se ne može poništiti.</small></p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Da, obriši',
      cancelButtonText: 'Odustani'
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, 'prijave', prijava.id));
        
        await Swal.fire({
          icon: 'success',
          title: 'Prijava obrisana',
          text: 'Prijava je uspješno obrisana.',
          timer: 2000,
          showConfirmButton: false
        });

      } catch (error) {
        console.error('Error deleting application:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Greška',
          text: 'Dogodila se greška prilikom brisanja prijave.'
        });
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusInfo = {
      pending: { text: 'Na čekanju', class: 'bg-yellow-100 text-yellow-800' },
      approved: { text: 'Odobreno', class: 'bg-green-100 text-green-800' },
      rejected: { text: 'Odbačeno', class: 'bg-red-100 text-red-800' }
    };

    const info = statusInfo[status] || { text: status, class: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${info.class}`}>
        {info.text}
      </span>
    );
  };

  const filteredPrijave = prijave.filter(prijava => {
    if (filter === 'all') return true;
    return prijava.status === filter;
  });

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Učitavanje...</div>
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  if (!natjecanje) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-500">Natjecanje nije pronađeno</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
            <Link href="/moja-natjecanja">
              <button className="bg-white text-[#666] font-bold px-4 py-2 rounded hover:bg-[#36b977] hover:text-white transition-colors duration-200">
                ← Moja natjecanja
              </button>
            </Link>
            <div className="flex flex-col">
              <span className="text-base font-bold text-white">
                III. gimnazija, Split
              </span>
              <span className="text-sm text-white">
                Upravljanje prijavama
              </span>
            </div>
          </div>
          
          <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xl lg:text-2xl font-extrabold text-white whitespace-nowrap tracking-wide transition-all duration-300 hover:scale-110 hover:text-[#36b977] cursor-pointer">
            PRIJAVE NA NATJECANJE
          </h1>
          
          <Link href="/natjecanja">
            <button className="bg-white text-[#666] font-bold px-4 py-2 rounded hover:bg-[#36b977] hover:text-white transition-colors duration-200 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
              </svg>
              Početna
            </button>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-6xl mx-auto p-6">
        {/* Competition info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-2 border-[#36b977]">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Natjecanje: {natjecanje.naziv}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <p><strong>Datum:</strong> {natjecanje.datum}</p>
              <p><strong>Kategorija:</strong> {natjecanje.kategorija}</p>
            </div>
            <div>
              <p><strong>Status:</strong> {natjecanje.status}</p>
              {natjecanje.publishedAt && (
                <p><strong>Objavljen:</strong> {new Date(natjecanje.publishedAt).toLocaleDateString('hr-HR')}</p>
              )}
            </div>
            <div>
              <p><strong>Ukupno prijava:</strong> {prijave.length}</p>
              <p><strong>Na čekanju:</strong> {prijave.filter(p => p.status === 'pending').length}</p>
            </div>
          </div>
        </div>

        {/* Info box */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 flex-shrink-0">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Važna napomena</h3>
              <p className="text-blue-700">
                Kao kreator ovog natjecanja, možete upravljati prijavama korisnika. 
                <strong> Obavezno ručno obavijestite korisnike putem email-a</strong> o statusu njihove prijave.
              </p>
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'pending', label: 'Na čekanju' },
              { key: 'approved', label: 'Odobreno' },
              { key: 'rejected', label: 'Odbačeno' },
              { key: 'all', label: 'Sve prijave' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  filter === tab.key 
                    ? 'bg-[#36b977] text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label} ({prijave.filter(p => tab.key === 'all' || p.status === tab.key).length})
              </button>
            ))}
          </div>
        </div>

        {/* Applications list */}
        {loadingApplications ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">Učitavanje prijava...</div>
          </div>
        ) : filteredPrijave.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-gray-500 text-lg">
              {prijave.length === 0 ? 'Nema prijava za ovo natjecanje' : 'Nema prijava s odabranim filterom'}
            </div>
            {prijave.length === 0 && (
              <p className="text-gray-400 text-sm mt-2">
                Kada se korisnici prijave na vaše natjecanje, njihove prijave će se pojaviti ovdje.
              </p>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredPrijave.map(prijava => (
              <div key={prijava.id} className="bg-white rounded-lg shadow-sm border-2 border-gray-100 p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Application info */}
                  <div className="lg:col-span-2">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">
                          {prijava.ime} {prijava.prezime}
                        </h3>
                      </div>
                      {getStatusBadge(prijava.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <p><strong>Email:</strong> {prijava.email}</p>
                        <p><strong>Razred:</strong> {prijava.razred || 'Nije navedeno'}</p>
                        {prijava.kontakt && (
                          <p><strong>Kontakt:</strong> {prijava.kontakt}</p>
                        )}
                      </div>
                      <div>
                        <p><strong>Datum prijave:</strong> {new Date(prijava.createdAt).toLocaleDateString('hr-HR')}</p>
                        {prijava.approvedBy && (
                          <p><strong>Odobrio:</strong> {prijava.approvedBy}</p>
                        )}
                        {prijava.rejectedBy && (
                          <p><strong>Odbacio:</strong> {prijava.rejectedBy}</p>
                        )}
                      </div>
                    </div>

                    {prijava.dodatneInformacije && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">Dodatne informacije:</p>
                        <p className="text-sm text-gray-600">{prijava.dodatneInformacije}</p>
                      </div>
                    )}

                    {prijava.rejectionReason && (
                      <div className="mt-4 p-3 bg-red-50 rounded-lg">
                        <p className="text-sm font-medium text-red-700">Razlog odbacivanja:</p>
                        <p className="text-sm text-red-600">{prijava.rejectionReason}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3">
                    {prijava.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(prijava)}
                          className="bg-[#36b977] text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Odobri
                        </button>
                        
                        <button
                          onClick={() => handleReject(prijava)}
                          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Odbaci
                        </button>
                      </>
                    )}
                    
                    <button
                      onClick={() => handleDelete(prijava)}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Obriši
                    </button>
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
