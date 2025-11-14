"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";
import { db, auth } from "../../firebase/config";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import Swal from 'sweetalert2';

// Force this page to be rendered on client-side only
export const dynamic = 'force-dynamic';

export default function AdminPanel() {
  const { user, isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('registrations');
  
  // Zahtjevi za registraciju
  const [zahtjevi, setZahtjevi] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all
  
  // Natjecanja za odobravanje
  const [natjecanja, setNatjecanja] = useState([]);
  const [loadingNatjecanja, setLoadingNatjecanja] = useState(true);
  const [natjecanjaFilter, setNatjecanjaFilter] = useState('pending');
  
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }
    
    if (!loading && !isAdmin) {
      router.push("/natjecanja");
      return;
    }

    if (isAdmin && user) {
      // Load registration requests with real-time updates
      const registrationQuery = query(collection(db, 'registrationRequests'), orderBy('createdAt', 'desc'));
      const unsubRegistration = onSnapshot(registrationQuery, 
        (snapshot) => {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          console.log('Registration requests loaded:', items);
          setZahtjevi(items);
          setLoadingRequests(false);
        }, 
        (err) => {
          console.error('Error loading registration requests:', err);
          setZahtjevi([]);
          setLoadingRequests(false);
        }
      );

      // Load competitions with real-time updates
      const natjecanjaQuery = query(collection(db, 'natjecanja'), orderBy('createdAt', 'desc'));
      const unsubNatjecanja = onSnapshot(natjecanjaQuery, 
        (snapshot) => {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          console.log('Competitions loaded:', items);
          setNatjecanja(items);
          setLoadingNatjecanja(false);
        }, 
        (err) => {
          console.error('Error loading competitions:', err);
          setNatjecanja([]);
          setLoadingNatjecanja(false);
        }
      );

      return () => {
        unsubRegistration();
        unsubNatjecanja();
      };
    }
  }, [user, isAdmin, loading, router]);

  const handleRegistrationAction = async (requestId, action) => {
    try {
      await azurirajStatusZahtjeva(requestId, action);
      loadRegistrationRequests(); // Reload data
    } catch (error) {
      console.error(`Greška pri ${action} zahtjeva:`, error);
    }
  };

  const handleApprove = async (zahtjev) => {
    const result = await Swal.fire({
      title: 'Odobri zahtjev?',
      html: `
        <p>Odobravate registraciju za:</p>
        <p><strong>${zahtjev.ime} ${zahtjev.prezime}</strong></p>
        <p><strong>Email:</strong> ${zahtjev.email}</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#36b977',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Da, odobri',
      cancelButtonText: 'Odustani'
    });

    if (result.isConfirmed) {
      try {
        // Create Firebase user with email and password
        const userCredential = await createUserWithEmailAndPassword(auth, zahtjev.email, zahtjev.password);
        
        // Update request status to approved
        await updateDoc(doc(db, 'registrationRequests', zahtjev.id), {
          status: 'approved',
          approvedAt: new Date().toISOString(),
          userId: userCredential.user.uid
        });

        await Swal.fire(
          'Odobreno!',
          'Korisnik je uspješno registriran.',
          'success'
        );
      } catch (error) {
        console.error('Error approving registration:', error);
        let errorMessage = 'Dogodila se greška prilikom odobravanja zahtjeva.';
        
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'Korisnik s tim emailom već postoji.';
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = 'Neispravna email adresa.';
        } else if (error.code === 'auth/weak-password') {
          errorMessage = 'Šifra je previše slaba.';
        }

        await Swal.fire(
          'Greška!',
          errorMessage,
          'error'
        );
      }
    }
  };

  const handleReject = async (zahtjev) => {
    const result = await Swal.fire({
      title: 'Odbaci zahtjev?',
      html: `
        <p>Odbacujete registraciju za:</p>
        <p><strong>${zahtjev.ime} ${zahtjev.prezime}</strong></p>
        <p><strong>Email:</strong> ${zahtjev.email}</p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Da, odbaci',
      cancelButtonText: 'Odustani'
    });

    if (result.isConfirmed) {
      try {
        await updateDoc(doc(db, 'registrationRequests', zahtjev.id), {
          status: 'rejected',
          rejectedAt: new Date().toISOString()
        });

        await Swal.fire(
          'Odbačeno!',
          'Zahtjev je odbačen.',
          'success'
        );
      } catch (error) {
        console.error('Error rejecting registration:', error);
        await Swal.fire(
          'Greška!',
          'Dogodila se greška prilikom odbacivanja zahtjeva.',
          'error'
        );
      }
    }
  };

  const handleDelete = async (zahtjev) => {
    const result = await Swal.fire({
      title: 'Obriši zahtjev?',
      html: `
        <p>Trajno brišete zahtjev za:</p>
        <p><strong>${zahtjev.ime} ${zahtjev.prezime}</strong></p>
        <p><strong>Email:</strong> ${zahtjev.email}</p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Da, obriši',
      cancelButtonText: 'Odustani'
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, 'registrationRequests', zahtjev.id));
        await Swal.fire(
          'Obrisano!',
          'Zahtjev je trajno obrisan.',
          'success'
        );
      } catch (error) {
        console.error('Error deleting registration request:', error);
        await Swal.fire(
          'Greška!',
          'Dogodila se greška prilikom brisanja zahtjeva.',
          'error'
        );
      }
    }
  };

  // Funkcije za upravljanje natjecanjima
  const handleApproveNatjecanje = async (natjecanje) => {
    const result = await Swal.fire({
      title: 'Odobri natjecanje?',
      html: `
        <p>Odobravate objavljivanje natjecanja:</p>
        <p><strong>${natjecanje.naziv}</strong></p>
        <p><strong>Datum:</strong> ${natjecanje.datum}</p>
        <p><strong>Kreirao:</strong> ${natjecanje.createdBy}</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#36b977',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Da, objavi',
      cancelButtonText: 'Odustani'
    });

    if (result.isConfirmed) {
      try {
        await updateDoc(doc(db, 'natjecanja', natjecanje.id), {
          status: 'published',
          approvedAt: new Date().toISOString(),
          approvedBy: user.email
        });

        await Swal.fire(
          'Objavljeno!',
          'Natjecanje je uspješno objavljeno.',
          'success'
        );
      } catch (error) {
        console.error('Error approving competition:', error);
        await Swal.fire(
          'Greška!',
          'Dogodila se greška prilikom objavljivanja natjecanja.',
          'error'
        );
      }
    }
  };

  const handleRejectNatjecanje = async (natjecanje) => {
    const result = await Swal.fire({
      title: 'Odbaci natjecanje?',
      html: `
        <p>Odbacujete natjecanje:</p>
        <p><strong>${natjecanje.naziv}</strong></p>
        <p><strong>Kreirao:</strong> ${natjecanje.createdBy}</p>
        <br/>
        <label for="rejection-reason" style="display: block; text-align: left; margin-bottom: 5px; font-weight: bold;">Razlog odbacivanja:</label>
        <textarea 
          id="rejection-reason" 
          placeholder="Unesite razlog odbacivanja (opcionalno)..."
          style="width: 100%; height: 80px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; resize: vertical; font-family: inherit;"
        ></textarea>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Da, odbaci',
      cancelButtonText: 'Odustani',
      preConfirm: () => {
        const reason = document.getElementById('rejection-reason').value.trim();
        return reason || null;
      }
    });

    if (result.isConfirmed) {
      try {
        const updateData = {
          status: 'rejected',
          rejectedAt: new Date().toISOString(),
          rejectedBy: user.email
        };

        // Dodaj razlog odbacivanja ako je unesen
        if (result.value) {
          updateData.rejectionReason = result.value;
        }

        await updateDoc(doc(db, 'natjecanja', natjecanje.id), updateData);

        await Swal.fire(
          'Odbačeno!',
          'Natjecanje je odbačeno.',
          'success'
        );
      } catch (error) {
        console.error('Error rejecting competition:', error);
        await Swal.fire(
          'Greška!',
          'Dogodila se greška prilikom odbacivanja natjecanja.',
          'error'
        );
      }
    }
  };

  const handleDeleteNatjecanje = async (natjecanje) => {
    const result = await Swal.fire({
      title: 'Obriši natjecanje?',
      html: `
        <p>Trajno brišete natjecanje:</p>
        <p><strong>${natjecanje.naziv}</strong></p>
        <p><strong>Kreirao:</strong> ${natjecanje.createdBy}</p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Da, obriši',
      cancelButtonText: 'Odustani'
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, 'natjecanja', natjecanje.id));
        await Swal.fire(
          'Obrisano!',
          'Natjecanje je trajno obrisano.',
          'success'
        );
      } catch (error) {
        console.error('Error deleting competition:', error);
        await Swal.fire(
          'Greška!',
          'Dogodila se greška prilikom brisanja natjecanja.',
          'error'
        );
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f6f6]">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#36b977] mb-4">Učitavanje...</div>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f6f6f6]">
      {/* Header */}
      <header className="w-full flex items-center justify-between px-6 py-4 bg-[#666] shadow-md">
        <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        <div className="flex items-center gap-4">
          <span className="text-white">Dobrodošli, {user?.email}</span>
          <Link href="/natjecanja">
            <button className="bg-white text-[#666] font-bold px-4 py-2 rounded hover:bg-[#36b977] hover:text-white transition-colors duration-200">
              Natrag na natjecanja
            </button>
          </Link>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="w-full bg-white shadow-sm">
        <div className="flex justify-center">
          <button
            onClick={() => setActiveTab('registrations')}
            className={`px-6 py-3 font-semibold ${
              activeTab === 'registrations'
                ? 'text-[#36b977] border-b-2 border-[#36b977]'
                : 'text-gray-600 hover:text-[#36b977]'
            }`}
          >
            Zahtjevi za registraciju
          </button>
          <button
            onClick={() => setActiveTab('competitions')}
            className={`px-6 py-3 font-semibold ${
              activeTab === 'competitions'
                ? 'text-[#36b977] border-b-2 border-[#36b977]'
                : 'text-gray-600 hover:text-[#36b977]'
            }`}
          >
            Natjecanja za odobravanje
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        {/* Zahtjevi za registraciju */}
        {activeTab === 'registrations' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Zahtjevi za registraciju</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-4 py-2 rounded ${filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Na čekanju ({zahtjevi.filter(z => z.status === 'pending').length})
                </button>
                <button
                  onClick={() => setFilter('approved')}
                  className={`px-4 py-2 rounded ${filter === 'approved' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Odobreni ({zahtjevi.filter(z => z.status === 'approved').length})
                </button>
                <button
                  onClick={() => setFilter('rejected')}
                  className={`px-4 py-2 rounded ${filter === 'rejected' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Odbačeni ({zahtjevi.filter(z => z.status === 'rejected').length})
                </button>
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Svi ({zahtjevi.length})
                </button>
              </div>
            </div>
            
            {loadingRequests ? (
              <div className="text-center py-8">
                <div className="text-lg text-gray-600">Učitavanje zahtjeva...</div>
              </div>
            ) : (() => {
              const filteredZahtjevi = filter === 'all' ? zahtjevi : zahtjevi.filter(z => z.status === filter);
              
              if (filteredZahtjevi.length === 0) {
                return (
                  <div className="text-center py-12 bg-white rounded-lg shadow">
                    <div className="text-gray-500 text-lg mb-2">
                      {filter === 'all' ? 'Nema zahtjeva za registraciju' : 
                       filter === 'pending' ? 'Nema zahtjeva na čekanju' :
                       filter === 'approved' ? 'Nema odobrenih zahtjeva' : 'Nema odbačenih zahtjeva'}
                    </div>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {filteredZahtjevi.map((zahtjev) => (
                    <div key={zahtjev.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-xl font-bold text-gray-800">
                                {zahtjev.ime} {zahtjev.prezime}
                              </h3>
                              <p className="text-gray-600 text-lg">{zahtjev.email}</p>
                              {zahtjev.razred && (
                                <p className="text-gray-500 text-sm">Razred: {zahtjev.razred}</p>
                              )}
                            </div>
                            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                              zahtjev.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              zahtjev.status === 'approved' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {zahtjev.status === 'pending' ? 'Na čekanju' :
                               zahtjev.status === 'approved' ? 'Odobren' : 'Odbačen'}
                            </span>
                          </div>
                          
                          <div className="mt-4 p-4 bg-gray-50 rounded">
                            <p className="text-sm font-medium text-gray-700 mb-2">Razlog registracije:</p>
                            <p className="text-gray-800">{zahtjev.razlog}</p>
                          </div>
                          
                          <div className="mt-4 text-sm text-gray-500">
                            <p>Zahtjev poslan: {new Date(zahtjev.createdAt).toLocaleDateString('hr-HR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</p>
                            {zahtjev.approvedAt && (
                              <p>Odobren: {new Date(zahtjev.approvedAt).toLocaleDateString('hr-HR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</p>
                            )}
                            {zahtjev.rejectedAt && (
                              <p>Odbačen: {new Date(zahtjev.rejectedAt).toLocaleDateString('hr-HR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-6 min-w-[120px]">
                          {zahtjev.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(zahtjev)}
                                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors text-sm font-medium"
                              >
                                ✓ Odobri
                              </button>
                              <button
                                onClick={() => handleReject(zahtjev)}
                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors text-sm font-medium"
                              >
                                ✗ Odbaci
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDelete(zahtjev)}
                            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors text-sm font-medium"
                          >
                            🗑 Obriši
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* Natjecanja za odobravanje */}
        {activeTab === 'competitions' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Natjecanja za odobravanje</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setNatjecanjaFilter('pending')}
                  className={`px-4 py-2 rounded ${natjecanjaFilter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Na čekanju ({natjecanja.filter(n => n.status === 'pending').length})
                </button>
                <button
                  onClick={() => setNatjecanjaFilter('published')}
                  className={`px-4 py-2 rounded ${natjecanjaFilter === 'published' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Objavljena ({natjecanja.filter(n => n.status === 'published').length})
                </button>
                <button
                  onClick={() => setNatjecanjaFilter('rejected')}
                  className={`px-4 py-2 rounded ${natjecanjaFilter === 'rejected' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Odbačena ({natjecanja.filter(n => n.status === 'rejected').length})
                </button>
                <button
                  onClick={() => setNatjecanjaFilter('all')}
                  className={`px-4 py-2 rounded ${natjecanjaFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Sva ({natjecanja.length})
                </button>
              </div>
            </div>
            
            {loadingNatjecanja ? (
              <div className="text-center py-8">
                <div className="text-lg text-gray-600">Učitavanje natjecanja...</div>
              </div>
            ) : (() => {
              const filteredNatjecanja = natjecanjaFilter === 'all' ? natjecanja : natjecanja.filter(n => n.status === natjecanjaFilter);
              
              if (filteredNatjecanja.length === 0) {
                return (
                  <div className="text-center py-12 bg-white rounded-lg shadow">
                    <div className="text-gray-500 text-lg mb-2">
                      {natjecanjaFilter === 'all' ? 'Nema natjecanja' : 
                       natjecanjaFilter === 'pending' ? 'Nema natjecanja na čekanju' :
                       natjecanjaFilter === 'published' ? 'Nema objavljenih natjecanja' : 'Nema odbačenih natjecanja'}
                    </div>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {filteredNatjecanja.map((natjecanje) => (
                    <div key={natjecanje.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-xl font-bold text-gray-800">
                                {natjecanje.naziv}
                              </h3>
                              <p className="text-gray-600 text-lg">Datum: {natjecanje.datum}</p>
                              <p className="text-gray-600">Kategorija: {natjecanje.kategorija}</p>
                              <p className="text-gray-500 text-sm">Kreirao: {natjecanje.createdBy}</p>
                            </div>
                            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                              natjecanje.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              natjecanje.status === 'published' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {natjecanje.status === 'pending' ? 'Na čekanju' :
                               natjecanje.status === 'published' ? 'Objavljeno' : 'Odbačeno'}
                            </span>
                          </div>
                          
                          {natjecanje.opis && (
                            <div className="mt-4 p-4 bg-gray-50 rounded">
                              <p className="text-sm font-medium text-gray-700 mb-2">Opis:</p>
                              <p className="text-gray-800">{natjecanje.opis}</p>
                            </div>
                          )}
                          
                          <div className="mt-4 text-sm text-gray-500">
                            <p>Kreirano: {new Date(natjecanje.createdAt).toLocaleDateString('hr-HR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</p>
                            {natjecanje.approvedAt && (
                              <p>Objavljeno: {new Date(natjecanje.approvedAt).toLocaleDateString('hr-HR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })} (od {natjecanje.approvedBy})</p>
                            )}
                            {natjecanje.rejectedAt && (
                              <p>Odbačeno: {new Date(natjecanje.rejectedAt).toLocaleDateString('hr-HR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })} (od {natjecanje.rejectedBy})</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-6 min-w-[120px]">
                          {natjecanje.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveNatjecanje(natjecanje)}
                                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors text-sm font-medium"
                              >
                                ✓ Objavi
                              </button>
                              <button
                                onClick={() => handleRejectNatjecanje(natjecanje)}
                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors text-sm font-medium"
                              >
                                ✗ Odbaci
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteNatjecanje(natjecanje)}
                            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors text-sm font-medium"
                          >
                            🗑 Obriši
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
