"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { db, auth } from "../../../firebase/config";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useAuth } from "../../../contexts/AuthContext";
import Swal from 'sweetalert2';

export default function AdminZahtjevi() {
  const { user, isAdmin, loading } = useAuth();
  const [zahtjevi, setZahtjevi] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all

  useEffect(() => {
    if (!isAdmin && !loading) {
      // Redirect non-admin users
      window.location.href = '/natjecanja';
      return;
    }

    // Load registration requests
    const q = query(collection(db, 'registrationRequests'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, 
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
    return () => unsub();
  }, [isAdmin, loading]);

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
        // Generate temporary password
        const tempPassword = 'temp' + Math.random().toString(36).slice(2, 8);
        
        // Create user account in Firebase Auth
        await createUserWithEmailAndPassword(auth, zahtjev.email, tempPassword);
        
        // Update request status
        await updateDoc(doc(db, 'registrationRequests', zahtjev.id), {
          status: 'approved',
          approvedAt: new Date().toISOString(),
          tempPassword: tempPassword,
          approvedBy: user.email
        });

        await Swal.fire({
          icon: 'success',
          title: 'Zahtjev odobren!',
          html: `
            <p>Korisnik je uspješno registriran.</p>
            <p><strong>Privremena lozinka:</strong> ${tempPassword}</p>
            <p><small><strong>Važno:</strong> Obavijestite korisnika putem email-a o odobrenju registracije i privremnoj lozinki.</small></p>
          `,
          confirmButtonText: 'U redu'
        });

      } catch (error) {
        console.error('Error approving request:', error);
        let errorMessage = 'Dogodila se greška prilikom odobravanja zahtjeva.';
        
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'Email adresa je već u upotrebi.';
        } else if (error.code === 'auth/weak-password') {
          errorMessage = 'Lozinka je preslaba.';
        }
        
        await Swal.fire({
          icon: 'error',
          title: 'Greška',
          text: errorMessage
        });
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
        await updateDoc(doc(db, 'registrationRequests', zahtjev.id), {
          status: 'rejected',
          rejectedAt: new Date().toISOString(),
          rejectionReason: result.value || '',
          rejectedBy: user.email
        });

        await Swal.fire({
          icon: 'success',
          title: 'Zahtjev odbačen',
          html: `
            <p>Zahtjev je uspješno odbačen.</p>
            <p><small>Ne zaboravite obavijestiti korisnika o odbacivanju zahtjeva putem email-a.</small>
          `,
          timer: 3000,
          showConfirmButton: true,
          confirmButtonText: 'U redu'
        });

      } catch (error) {
        console.error('Error rejecting request:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Greška',
          text: 'Dogodila se greška prilikom odbacivanja zahtjeva.'
        });
      }
    }
  };

  const handleDelete = async (zahtjev) => {
    const result = await Swal.fire({
      title: 'Obriši zahtjev?',
      html: `
        <p>Brisanje zahtjeva za:</p>
        <p><strong>${zahtjev.ime} ${zahtjev.prezime}</strong></p>
        <p><strong>Email:</strong> ${zahtjev.email}</p>
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
        await deleteDoc(doc(db, 'registrationRequests', zahtjev.id));

        await Swal.fire({
          icon: 'success',
          title: 'Zahtjev obrisan',
          text: 'Zahtjev je uspješno obrisan.',
          timer: 2000,
          showConfirmButton: false
        });

      } catch (error) {
        console.error('Error deleting request:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Greška',
          text: 'Dogodila se greška prilikom brisanja zahtjeva.'
        });
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { text: 'Na čekanju', class: 'bg-yellow-100 text-yellow-800' },
      approved: { text: 'Odobreno', class: 'bg-green-100 text-green-800' },
      rejected: { text: 'Odbačeno', class: 'bg-red-100 text-red-800' }
    };
    const statusInfo = statusMap[status] || { text: status, class: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.class}`}>
        {statusInfo.text}
      </span>
    );
  };

  const filteredZahtjevi = zahtjevi.filter(zahtjev => {
    if (filter === 'all') return true;
    return zahtjev.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Učitavanje...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-500">Nemate dozvolu za pristup ovoj stranici</div>
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
            <Link href="/admin">
              <button className="bg-white text-[#666] font-bold px-4 py-2 rounded hover:bg-[#36b977] hover:text-white transition-colors duration-200">
                ← Admin panel
              </button>
            </Link>
            <div className="flex flex-col">
              <span className="text-base font-bold text-white">
                III. gimnazija, Split
              </span>
              <span className="text-sm text-white">
                Zahtjevi za registraciju
              </span>
            </div>
          </div>
          
          <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl lg:text-3xl font-extrabold text-white whitespace-nowrap tracking-wide transition-all duration-300 hover:scale-110 hover:text-[#36b977] cursor-pointer">
            ZAHTJEVI ZA REGISTRACIJU
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
                Sistem ne šalje email-ove automatski. Nakon odobravanja ili odbacivanja zahtjeva, 
                <strong> obavezno je ručno obavijestiti korisnika putem email-a</strong> o statusu njihovog zahtjeva.
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
              { key: 'all', label: 'Svi zahtjevi' }
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
                {tab.label} ({zahtjevi.filter(z => tab.key === 'all' || z.status === tab.key).length})
              </button>
            ))}
          </div>
        </div>

        {/* Requests list */}
        {loadingRequests ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">Učitavanje zahtjeva...</div>
          </div>
        ) : filteredZahtjevi.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-lg text-gray-600">
              {filter === 'all' ? 'Nema zahtjeva za registraciju' : `Nema ${filter === 'pending' ? 'zahtjeva na čekanju' : filter === 'approved' ? 'odobrenih zahtjeva' : 'odbačenih zahtjeva'}`}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredZahtjevi.map(zahtjev => (
              <div key={zahtjev.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Request info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {zahtjev.ime} {zahtjev.prezime}
                      </h3>
                      {getStatusBadge(zahtjev.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><strong>Email:</strong> {zahtjev.email}</p>
                        <p><strong>Razred:</strong> {zahtjev.razred || 'Nije navedeno'}</p>
                        <p><strong>Datum zahtjeva:</strong> {new Date(zahtjev.createdAt).toLocaleDateString('hr-HR')}</p>
                      </div>
                      <div>
                        {zahtjev.approvedBy && (
                          <p><strong>Odobrio:</strong> {zahtjev.approvedBy}</p>
                        )}
                        {zahtjev.rejectedBy && (
                          <p><strong>Odbacio:</strong> {zahtjev.rejectedBy}</p>
                        )}
                        {zahtjev.tempPassword && (
                          <p><strong>Privremena lozinka:</strong> {zahtjev.tempPassword}</p>
                        )}
                      </div>
                    </div>
                    
                    {zahtjev.razlog && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <p className="text-sm"><strong>Razlog registracije:</strong></p>
                        <p className="text-sm text-gray-700 mt-1">{zahtjev.razlog}</p>
                      </div>
                    )}
                    
                    {zahtjev.rejectionReason && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm"><strong>Razlog odbacivanja:</strong></p>
                        <p className="text-sm text-red-700 mt-1">{zahtjev.rejectionReason}</p>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 lg:flex-col">
                    {zahtjev.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(zahtjev)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Odobri
                        </button>
                        <button
                          onClick={() => handleReject(zahtjev)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Odbaci
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(zahtjev)}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center justify-center gap-2"
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
