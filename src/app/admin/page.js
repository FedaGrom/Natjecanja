"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";
import { db, auth } from "../../firebase/config";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, setDoc, getDocs, getDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { getAuth } from "firebase/auth";
import Swal from 'sweetalert2';

// Force this page to be rendered on client-side only
export const dynamic = 'force-dynamic';

export default function AdminPanel() {
  const { user, isAdmin, loading, refreshAdminStatus } = useAuth();
  const [activeTab, setActiveTab] = useState('registrations');
  
  // Zahtjevi za registraciju
  const [zahtjevi, setZahtjevi] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all
  
  // Događanja za odobravanje
  const [natjecanja, setNatjecanja] = useState([]);
  const [loadingNatjecanja, setLoadingNatjecanja] = useState(true);
  const [natjecanjaFilter, setNatjecanjaFilter] = useState('pending');
  
  // Korisnici i admini
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
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

      // Load users and admins
      const loadUsersAndAdmins = async () => {
        try {
          console.log('Loading users and admins...');
          
          // Try to load from multiple potential user collections
          let allUsers = [];
          
          // 1. Load from registrationRequests (approved users)
          try {
            const registrationQuery = query(collection(db, 'registrationRequests'));
            const registrationSnapshot = await getDocs(registrationQuery);
            const registrationUsers = registrationSnapshot.docs.map(doc => ({ 
              id: doc.id, 
              source: 'registrationRequests',
              ...doc.data() 
            }));
            allUsers = [...allUsers, ...registrationUsers];
            console.log('Found users in registrationRequests:', registrationUsers.length);
          } catch (error) {
            console.log('No registrationRequests collection found:', error);
          }

          // 2. Try to load from 'users' collection if it exists
          try {
            const usersQuery = query(collection(db, 'users'));
            const usersSnapshot = await getDocs(usersQuery);
            const directUsers = usersSnapshot.docs.map(doc => ({ 
              id: doc.id, 
              source: 'users',
              uid: doc.id, // In users collection, doc ID is usually the UID
              ...doc.data() 
            }));
            allUsers = [...allUsers, ...directUsers];
            console.log('Found users in users collection:', directUsers.length);
          } catch (error) {
            console.log('No users collection found:', error);
          }

          console.log('ALL users from all sources:', allUsers);
          
          // Remove duplicates (prefer 'users' collection over 'registrationRequests')
          const uniqueUsers = allUsers.reduce((acc, user) => {
            const existingIndex = acc.findIndex(existing => 
              existing.email === user.email || 
              existing.uid === user.uid ||
              existing.userId === user.uid
            );
            
            if (existingIndex === -1) {
              acc.push(user);
            } else if (user.source === 'users' && acc[existingIndex].source === 'registrationRequests') {
              // Prefer users collection over registrationRequests
              acc[existingIndex] = user;
            }
            
            return acc;
          }, []);

          console.log('Unique users after deduplication:', uniqueUsers);
          
          // Separate by status and prepare for display
          const activeUsers = uniqueUsers.filter(user => 
            // Include all users from 'users' collection, and approved users from registrationRequests
            user.source === 'users' || 
            (user.source === 'registrationRequests' && user.status === 'approved')
          );
          
          // Format users for display
          const usersList = activeUsers.map(user => ({
            ...user,
            uid: user.uid || user.userId || user.id, // Ensure we have a UID field
            email: user.email,
            ime: user.ime || user.firstName || user.displayName?.split(' ')[0] || 'N/A',
            prezime: user.prezime || user.lastName || user.displayName?.split(' ')[1] || '',
            createdAt: user.createdAt || user.requestedAt || user.registracija || new Date(),
            approvedAt: user.processedAt || user.updatedAt || user.approvedAt
          }));
          
          // Load admins - document ID is the UID
          const adminsQuery = query(collection(db, 'admins'));
          const adminsSnapshot = await getDocs(adminsQuery);
          const adminsList = adminsSnapshot.docs.map(doc => ({ 
            uid: doc.id,  // Document ID is the UID
            ...doc.data() 
          }));

          // Match admin UIDs with user data where possible
          const enrichedAdmins = adminsList.map(admin => {
            // Find user data if available
            const userData = usersList.find(user => user.uid === admin.uid);
            return {
              ...admin,
              email: admin.email || userData?.email || 'N/A',
              name: userData ? `${userData.ime} ${userData.prezime}`.trim() : null
            };
          });

          setUsers(usersList);
          setAdmins(enrichedAdmins);
          setLoadingUsers(false);
          console.log('Final users and admins loaded:', { 
            users: usersList.length, 
            admins: enrichedAdmins.length,
            usersList,
            adminsList: enrichedAdmins
          });
        } catch (error) {
          console.error('Error loading users and admins:', error);
          setLoadingUsers(false);
        }
      };

      loadUsersAndAdmins();

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
        
        // Add user to 'users' collection in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: zahtjevi.email,
          ime: zahtjevi.ime,
          prezime: zahtjevi.prezime,
          razred: zahtjevi.razred || '',
          registracija: new Date(),
          approvedAt: new Date(),
          approvedBy: user.email,
          uid: userCredential.user.uid
        });
        
        // Update request status to approved
        await updateDoc(doc(db, 'registrationRequests', zahtjev.id), {
          status: 'approved',
          approvedAt: new Date().toISOString(),
          userId: userCredential.user.uid
        });

        await Swal.fire(
          'Odobreno!',
          'Korisnik je uspješno registriran i dodan u bazu.',
          'success'
        );
        
        // Reload users data to show the new user
        window.location.reload();
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

  // Admin management functions
  const handleMakeAdmin = async (userEmail, userId) => {
    const result = await Swal.fire({
      title: 'Dodijeli admin prava?',
      html: `
        <p>Želite dati admin prava korisniku:</p>
        <p><strong>${userEmail}</strong></p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#36b977',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Da, dodijeli',
      cancelButtonText: 'Odustani'
    });

    if (result.isConfirmed) {
      try {
        // Use existing structure: document ID = UID, simple role field
        await setDoc(doc(db, 'admins', userId), {
          role: 'admin',
          email: userEmail, // Store email for reference
          assignedBy: user.email,
          assignedAt: new Date().toISOString()
        });

        await Swal.fire('Uspjeh!', 'Admin prava su uspješno dodijeljena.', 'success');
        
        // Refresh admin status for all users and reload data
        if (refreshAdminStatus) {
          await refreshAdminStatus();
        }
        window.location.reload();
      } catch (error) {
        console.error('Error making user admin:', error);
        await Swal.fire('Greška!', 'Dogodila se greška prilikom dodjeljivanja admin prava.', 'error');
      }
    }
  };

  const handleRemoveAdmin = async (adminUid, adminEmail) => {
    if (adminUid === user.uid) {
      await Swal.fire('Greška!', 'Ne možete ukloniti admin prava sebi.', 'error');
      return;
    }

    const result = await Swal.fire({
      title: 'Ukloni admin prava?',
      html: `
        <p>Želite ukloniti admin prava korisniku:</p>
        <p><strong>${adminEmail}</strong></p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Da, ukloni',
      cancelButtonText: 'Odustani'
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, 'admins', adminUid));
        await Swal.fire('Uspjeh!', 'Admin prava su uspješno uklonjena.', 'success');
        
        // Refresh admin status for all users and reload data
        if (refreshAdminStatus) {
          await refreshAdminStatus();
        }
        window.location.reload();
      } catch (error) {
        console.error('Error removing admin:', error);
        await Swal.fire('Greška!', 'Dogodila se greška prilikom uklanjanja admin prava.', 'error');
      }
    }
  };

  // Funkcije za upravljanje događanjima
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
          'Događanje je uspješno objavljeno.',
          'success'
        );
      } catch (error) {
        console.error('Error approving competition:', error);
        await Swal.fire(
          'Greška!',
          'Dogodila se greška prilikom objavljivanja događanja.',
          'error'
        );
      }
    }
  };

  const handleRejectNatjecanje = async (natjecanje) => {
    const result = await Swal.fire({
      title: 'Odbaci događanje?',
      html: `
        <p>Odbacujete događanje:</p>
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
          'Događanje je odbačeno.',
          'success'
        );
      } catch (error) {
        console.error('Error rejecting competition:', error);
        await Swal.fire(
          'Greška!',
          'Dogodila se greška prilikom odbacivanja događanja.',
          'error'
        );
      }
    }
  };

  const handleDeleteNatjecanje = async (natjecanje) => {
    const result = await Swal.fire({
      title: 'Obriši događanje?',
      html: `
        <p>Trajno brišete događanje:</p>
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
          'Događanje je trajno obrisano.',
          'success'
        );
      } catch (error) {
        console.error('Error deleting competition:', error);
        await Swal.fire(
          'Greška!',
          'Dogodila se greška prilikom brisanja događanja.',
          'error'
        );
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-yellow-50">
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-600 mb-4">Učitavanje...</div>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 w-full flex items-center justify-between px-4 md:px-6 py-3 md:py-4 bg-amber-600 shadow-md z-50">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <img src="/slike/logo.jpg.png" alt="Logo" width={40} height={40} className="md:w-12 md:h-12 rounded border-2 border-amber-200 shadow bg-white flex-shrink-0" />
          <h1 className="text-xl md:text-2xl font-bold text-white truncate">Admin Panel</h1>
        </div>
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <span className="hidden sm:inline text-white truncate max-w-[40vw]">Dobrodošli, {user?.email}</span>
          <Link href="/natjecanja">
            <button className="bg-white text-[#666] font-bold px-3 md:px-4 py-2 rounded hover:bg-amber-100 hover:text-amber-700 transition-colors duration-200 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              Početna
            </button>
          </Link>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="sticky top-16 md:top-20 w-full bg-amber-50 shadow-sm border-b border-amber-100 z-40">
        <div className="flex flex-wrap justify-center">
          <button onClick={() => setActiveTab('registrations')} className={`px-4 md:px-6 py-2 md:py-3 text-sm md:text-base font-semibold ${activeTab === 'registrations' ? 'text-amber-700 border-b-2 border-amber-500' : 'text-gray-700 hover:text-amber-600'}`}>Zahtjevi za registraciju</button>
          <button onClick={() => setActiveTab('applications')} className={`px-4 md:px-6 py-2 md:py-3 text-sm md:text-base font-semibold ${activeTab === 'applications' ? 'text-amber-700 border-b-2 border-amber-500' : 'text-gray-700 hover:text-amber-600'}`}>Prijave na događanja</button>
          <button onClick={() => setActiveTab('competitions')} className={`px-4 md:px-6 py-2 md:py-3 text-sm md:text-base font-semibold ${activeTab === 'competitions' ? 'text-amber-700 border-b-2 border-amber-500' : 'text-gray-700 hover:text-amber-600'}`}>Događanja za odobravanje</button>
          <button onClick={() => setActiveTab('users')} className={`px-4 md:px-6 py-2 md:py-3 text-sm md:text-base font-semibold ${activeTab === 'users' ? 'text-amber-700 border-b-2 border-amber-500' : 'text-gray-700 hover:text-amber-600'}`}>Korisnici i Admini</button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        {/* Zahtjevi za registraciju */}
        {activeTab === 'registrations' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-amber-900">Zahtjevi za registraciju</h2>
              <div className="flex flex-wrap gap-2 justify-end max-w-full">
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-3 py-2 rounded text-sm w-auto ${filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Na čekanju ({zahtjevi.filter(z => z.status === 'pending').length})
                </button>
                <button
                  onClick={() => setFilter('approved')}
                  className={`px-3 py-2 rounded text-sm w-auto ${filter === 'approved' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Odobreni ({zahtjevi.filter(z => z.status === 'approved').length})
                </button>
                <button
                  onClick={() => setFilter('rejected')}
                  className={`px-3 py-2 rounded text-sm w-auto ${filter === 'rejected' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Odbačeni ({zahtjevi.filter(z => z.status === 'rejected').length})
                </button>
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-2 rounded text-sm w-auto ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
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
                  <div className="text-center py-12 bg-white rounded-lg shadow border border-amber-100">
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
                    <div key={zahtjev.id} className="bg-white rounded-lg shadow-md p-6 border border-amber-200 hover:border-amber-300 hover:shadow-lg transition">
                      <div className="flex flex-col md:flex-row md:justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
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
                          
                          <div className="mt-4 p-4 bg-amber-50 rounded">
                            <p className="text-sm font-medium text-amber-900 mb-2">Razlog registracije:</p>
                            <p className="text-gray-800 break-words whitespace-normal">{zahtjev.razlog}</p>
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
                        
                        {/* Actions: on mobile, place as a row below content */}
                        <div className="flex w-full md:w-auto flex-row md:flex-col gap-2 md:ml-6 flex-shrink-0 justify-end">
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
                            className="bg-red-500 text-white p-2 rounded hover:bg-red-600 transition-colors duration-200 flex items-center justify-center shadow-lg"
                            title="Obriši"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
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

        {/* Prijave na događanja */}
        {activeTab === 'applications' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Prijave na događanja</h2>
              <Link href="/admin/prijave">
                <button className="bg-[#36b977] text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center gap-2 font-medium">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Pogledaj sve prijave
                </button>
              </Link>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Upravljanje prijavama na događanja
                </h3>
                <p className="text-gray-600 mb-6">
                  Ovdje možete pregledati, odobriti ili odbaciti prijave korisnika na događanja. 
                  Kliknite na gumb iznad za detaljni pregled svih prijava.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="text-yellow-600 font-semibold">Na čekanju</div>
                    <div className="text-gray-700">Nove prijave koje čekaju pregled</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-green-600 font-semibold">Odobrene</div>
                    <div className="text-gray-700">Prijave koje su odobrene</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="text-red-600 font-semibold">Odbačene</div>
                    <div className="text-gray-700">Prijave koje su odbačene</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Događanja za odobravanje */}
        {activeTab === 'competitions' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Događanja za odobravanje</h2>
              <div className="flex flex-wrap gap-2 justify-end max-w-full">
                <button
                  onClick={() => setNatjecanjaFilter('pending')}
                  className={`px-3 py-2 rounded text-sm w-auto ${natjecanjaFilter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Na čekanju ({natjecanja.filter(n => n.status === 'pending').length})
                </button>
                <button
                  onClick={() => setNatjecanjaFilter('published')}
                  className={`px-3 py-2 rounded text-sm w-auto ${natjecanjaFilter === 'published' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Objavljena ({natjecanja.filter(n => n.status === 'published').length})
                </button>
                <button
                  onClick={() => setNatjecanjaFilter('rejected')}
                  className={`px-3 py-2 rounded text-sm w-auto ${natjecanjaFilter === 'rejected' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Odbačena ({natjecanja.filter(n => n.status === 'rejected').length})
                </button>
                <button
                  onClick={() => setNatjecanjaFilter('all')}
                  className={`px-3 py-2 rounded text-sm w-auto ${natjecanjaFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Sva ({natjecanja.length})
                </button>
              </div>
            </div>

            {loadingNatjecanja ? (
              <div className="text-center py-8">
                <div className="text-lg text-gray-600">Učitavanje događanja...</div>
              </div>
            ) : (() => {
              const filteredNatjecanja = natjecanjaFilter === 'all' ? natjecanja : natjecanja.filter(n => n.status === natjecanjaFilter);

              if (filteredNatjecanja.length === 0) {
                return (
                  <div className="text-center py-12 bg-white rounded-lg shadow">
                    <div className="text-gray-500 text-lg mb-2">
                      {natjecanjaFilter === 'all' ? 'Nema događanja' :
                        natjecanjaFilter === 'pending' ? 'Nema događanja na čekanju' :
                          natjecanjaFilter === 'published' ? 'Nema objavljenih događanja' : 'Nema odbačenih događanja'}
                    </div>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {filteredNatjecanja.map((natjecanje) => (
                    <div key={natjecanje.id} className="bg-white rounded-lg shadow-md p-6 border border-amber-200 hover:border-amber-300 hover:shadow-lg transition">
                      <div className="flex flex-col md:flex-row md:justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-xl font-bold text-gray-800">{natjecanje.naziv}</h3>
                              <p className="text-gray-600 text-lg">Datum: {natjecanje.datum}</p>
                              <p className="text-gray-600">Kategorija: {natjecanje.kategorija}</p>
                              <p className="text-gray-500 text-sm">Kreirao: {natjecanje.createdBy}</p>
                            </div>
                            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                              natjecanje.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              natjecanje.status === 'published' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {natjecanje.status === 'pending' ? 'Na čekanju' : natjecanje.status === 'published' ? 'Objavljeno' : 'Odbačeno'}
                            </span>
                          </div>

                          {natjecanje.opis && (
                            <div className="mt-4 p-4 bg-gray-50 rounded">
                              <p className="text-sm font-medium text-gray-700 mb-2">Opis:</p>
                              <p className="text-gray-800 break-words whitespace-normal">{natjecanje.opis}</p>
                            </div>
                          )}

                          <div className="mt-4 text-sm text-gray-500">
                            <p>Kreirano: {new Date(natjecanje.createdAt).toLocaleDateString('hr-HR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                            {natjecanje.approvedAt && (
                              <p>Objavljeno: {new Date(natjecanje.approvedAt).toLocaleDateString('hr-HR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} (od {natjecanje.approvedBy})</p>
                            )}
                            {natjecanje.rejectedAt && (
                              <p>Odbačeno: {new Date(natjecanje.rejectedAt).toLocaleDateString('hr-HR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} (od {natjecanje.rejectedBy})</p>
                            )}
                          </div>
                        </div>
                        
                        {/* Actions: on mobile, place as a row below content */}
                        <div className="flex w-full md:w-auto flex-row md:flex-col gap-2 md:ml-6 flex-shrink-0 justify-end">
                          {natjecanje.status === 'pending' && (
                            <>
                              <button onClick={() => handleApproveNatjecanje(natjecanje)} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors text-sm font-medium">✓ Objavi</button>
                              <button onClick={() => handleRejectNatjecanje(natjecanje)} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors text-sm font-medium">✗ Odbaci</button>
                            </>
                          )}
                          <button onClick={() => handleDeleteNatjecanje(natjecanje)} className="bg-red-500 text-white p-2 rounded hover:bg-red-600 transition-colors duration-200 flex items-center justify-center shadow-lg" title="Obriši">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
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

        {activeTab === 'users' && (
          <div>
            <div className="bg-white rounded-lg shadow p-6 text-gray-700">Upravljanje korisnicima privremeno nije dostupno.</div>
          </div>
        )}
      </div>
    </div>
  );
}
