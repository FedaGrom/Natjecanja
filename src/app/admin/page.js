"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthChange } from "../../../lib/auth";
import { isAdmin, dohvatiZahtjeveZaRegistraciju, azurirajStatusZahtjeva } from "../../../lib/admin";
import { dohvatiSvaNatjecanja, azurirajStatusNatjecanja } from "../../../lib/natjecanja";

export default function AdminPanel() {
  const [user, setUser] = useState(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('registrations');
  
  // Zahtjevi za registraciju
  const [registrationRequests, setRegistrationRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  
  // Natjecanja za odobravanje
  const [natjecanja, setNatjecanja] = useState([]);
  const [loadingNatjecanja, setLoadingNatjecanja] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setUser(user);
      
      if (user) {
        // Provjeri da li je admin
        const adminStatus = await isAdmin(user.uid);
        setIsUserAdmin(adminStatus);
        
        if (!adminStatus) {
          router.push("/natjecanja");
          return;
        }
      } else {
        router.push("/login");
        return;
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadRegistrationRequests = async () => {
    setLoadingRequests(true);
    try {
      const requests = await dohvatiZahtjeveZaRegistraciju();
      setRegistrationRequests(requests);
    } catch (error) {
      console.error("Greška pri učitavanju zahtjeva:", error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const loadNatjecanja = async () => {
    setLoadingNatjecanja(true);
    try {
      const allNatjecanja = await dohvatiSvaNatjecanja();
      setNatjecanja(allNatjecanja);
    } catch (error) {
      console.error("Greška pri učitavanju natjecanja:", error);
    } finally {
      setLoadingNatjecanja(false);
    }
  };

  useEffect(() => {
    if (isUserAdmin) {
      loadRegistrationRequests();
      loadNatjecanja();
    }
  }, [isUserAdmin]);

  const handleRegistrationAction = async (requestId, action) => {
    try {
      await azurirajStatusZahtjeva(requestId, action);
      loadRegistrationRequests(); // Reload data
    } catch (error) {
      console.error(`Greška pri ${action} zahtjeva:`, error);
    }
  };

  const handleNatjecanjeAction = async (natjecanjeId, action) => {
    try {
      await azurirajStatusNatjecanja(natjecanjeId, action);
      loadNatjecanja(); // Reload data
    } catch (error) {
      console.error(`Greška pri ${action} natjecanja:`, error);
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

  if (!user || !isUserAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f6f6f6]">
      {/* Header */}
      <header className="w-full flex items-center justify-between px-6 py-4 bg-[#666] shadow-md">
        <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        <div className="flex items-center gap-4">
          <span className="text-white">Dobrodošli, {user.displayName || user.email}</span>
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
        {activeTab === 'registrations' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Zahtjevi za registraciju</h2>
            
            {loadingRequests ? (
              <div className="text-center py-8">Učitavanje zahtjeva...</div>
            ) : registrationRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-600">Nema novih zahtjeva za registraciju.</div>
            ) : (
              <div className="grid gap-4">
                {registrationRequests.map((request) => (
                  <div key={request.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800">{request.displayName}</h3>
                        <p className="text-gray-600">{request.email}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Zahtjev poslan: {request.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                        </p>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-2 ${
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {request.status === 'pending' ? 'Na čekanju' :
                           request.status === 'approved' ? 'Odobren' : 'Odbačen'}
                        </span>
                      </div>
                      
                      {request.status === 'pending' && (
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleRegistrationAction(request.id, 'approved')}
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                          >
                            Odobri
                          </button>
                          <button
                            onClick={() => handleRegistrationAction(request.id, 'rejected')}
                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                          >
                            Odbaci
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'competitions' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Natjecanja za odobravanje</h2>
            
            {loadingNatjecanja ? (
              <div className="text-center py-8">Učitavanje natjecanja...</div>
            ) : natjecanja.length === 0 ? (
              <div className="text-center py-8 text-gray-600">Nema natjecanja za pregled.</div>
            ) : (
              <div className="grid gap-4">
                {natjecanja.map((natjecanje) => (
                  <div key={natjecanje.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800">{natjecanje.naziv}</h3>
                        <p className="text-gray-600">Datum: {natjecanje.datum}</p>
                        <p className="text-gray-600 mt-2">{natjecanje.opis}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Kreirao: {natjecanje.createdByName || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Poslano: {natjecanje.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                        </p>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-2 ${
                          natjecanje.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          natjecanje.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {natjecanje.status === 'pending' ? 'Na čekanju' :
                           natjecanje.status === 'approved' ? 'Objavljeno' : 'Odbačeno'}
                        </span>
                      </div>
                      
                      {natjecanje.status === 'pending' && (
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleNatjecanjeAction(natjecanje.id, 'approved')}
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                          >
                            Objavi
                          </button>
                          <button
                            onClick={() => handleNatjecanjeAction(natjecanje.id, 'rejected')}
                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                          >
                            Odbaci
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
