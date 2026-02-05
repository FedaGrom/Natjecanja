"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { db } from "../../../../firebase/config";
import { doc, getDoc, collection, addDoc } from "firebase/firestore";
import { useAuth } from "../../../../contexts/AuthContext";
import Swal from 'sweetalert2';

export default function PrijavaNatjecanje() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [natjecanje, setNatjecanje] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    ime: "",
    prezime: "",
    email: "",
    razred: "",
    dodatneInformacije: "",
    kontakt: "",
    nazivGrupe: "",
    // clanoviGrupe sada sadrže razred umjesto email-a
    clanoviGrupe: [{ ime: "", prezime: "", razred: "" }],
    vrstaPrijave: 'individual',
  });

  // Load competition data
  useEffect(() => {
    const loadNatjecanje = async () => {
      if (!id) return;
      
      try {
        const docRef = doc(db, 'natjecanja', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setNatjecanje(data);
        } else {
          console.log('No such document!');
        }
      } catch (error) {
        console.error('Error loading natjecanje:', error);
        // Fallback to localStorage
        const localNatjecanja = JSON.parse(localStorage.getItem('natjecanja') || '[]');
        const found = localNatjecanja.find(n => n.id === id);
        if (found) {
          setNatjecanje(found);
        }
      } finally {
        setLoading(false);
      }
    };

    loadNatjecanje();
  }, [id]);

  // Auto-fill user data if logged in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        email: user.email || ""
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMemberChange = (idx, field, value) => {
    setFormData(prev => {
      const arr = [...prev.clanoviGrupe];
      arr[idx] = { ...arr[idx], [field]: value };
      return { ...prev, clanoviGrupe: arr };
    });
  };

  const addMember = () => {
    setFormData(prev => ({
      ...prev,
      clanoviGrupe: [...prev.clanoviGrupe, { ime: "", prezime: "", razred: "" }]
    }));
  };

  const removeMember = (idx) => {
    setFormData(prev => ({
      ...prev,
      clanoviGrupe: prev.clanoviGrupe.filter((_, i) => i !== idx)
    }));
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // Block submissions if phase is not 'prijave'
    if ((natjecanje?.phase || 'prijave') !== 'prijave') {
      await Swal.fire({
        icon: 'info',
        title: 'Prijave su zatvorene',
        text: natjecanje?.phase === 'aktivan' 
          ? 'Događanje je u tijeku, prijave više nisu moguće.'
          : 'Događanje je završilo, prijave nisu moguće.'
      });
      setSubmitting(false);
      return;
    }

    const teamMode = (natjecanje?.vrstaNatjecanja || 'individual') === 'team';
    const minMembers = natjecanje?.teamMinMembers || null;
    const maxMembers = natjecanje?.teamMaxMembers || null;

    if (teamMode) {
      if (!formData.nazivGrupe.trim()) {
        await Swal.fire({ icon: 'error', title: 'Greška', text: 'Unesite naziv ekipe/razreda.' });
        setSubmitting(false);
        return;
      }
      const membersCount = formData.clanoviGrupe.length;
      if (minMembers && membersCount < minMembers) {
        await Swal.fire({ icon: 'error', title: 'Greška', text: `Minimalan broj članova je ${minMembers}.` });
        setSubmitting(false);
        return;
      }
      if (maxMembers && membersCount > maxMembers) {
        await Swal.fire({ icon: 'error', title: 'Greška', text: `Maksimalan broj članova je ${maxMembers}.` });
        setSubmitting(false);
        return;
      }
      // Validacija članova: ime, prezime, razred
      for (const [i, m] of formData.clanoviGrupe.entries()) {
        if (!m.ime || !m.prezime || !m.razred) {
          await Swal.fire({ icon: 'error', title: 'Greška', text: `Unesite ime, prezime i razred za člana #${i + 1}.` });
          setSubmitting(false);
          return;
        }
      }
    } else {
      // Individualna validacija postojećih polja
      if (!formData.ime || !formData.prezime || !formData.email) {
        await Swal.fire({ icon: 'error', title: 'Greška', text: 'Molimo unesite sve obavezne podatke (ime, prezime, email)' });
        setSubmitting(false);
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        await Swal.fire({ icon: 'error', title: 'Neispravna email adresa', text: 'Molimo unesite ispravnu email adresu' });
        setSubmitting(false);
        return;
      }
    }

    try {
      await addDoc(collection(db, 'prijave'), {
        ...formData,
        // clanoviGrupe s razredom će se spremiti kako je
        vrstaPrijave: teamMode ? 'group' : 'individual',
        natjecanjeId: id,
        natjecanjeNaziv: natjecanje.naziv,
        status: 'pending',
        createdAt: new Date().toISOString(),
        timestamp: Date.now(),
        userId: user ? user.uid : null
      });

      await Swal.fire({
        icon: 'success',
        title: 'Prijava poslana!',
        html: teamMode
          ? `<p>Prijava ekipe <strong>"${formData.nazivGrupe}"</strong> na događanje <strong>"${natjecanje.naziv}"</strong> je uspješno poslana.</p>`
          : `<p>Vaša prijava na događanje <strong>"${natjecanje.naziv}"</strong> je uspješno poslana.</p>`,
        confirmButtonText: 'U redu'
      });

      setFormData({
        ime: "",
        prezime: "",
        email: user ? user.email : "",
        razred: "",
        dodatneInformacije: "",
        kontakt: "",
        nazivGrupe: "",
        clanoviGrupe: [{ ime: "", prezime: "", razred: "" }],
        vrstaPrijave: teamMode ? 'group' : 'individual',
      });

      // Redirect back to competition details after 2 seconds
      setTimeout(() => {
        router.push(`/natjecanja/${id}`);
      }, 2000);

    } catch (error) {
      console.error('Error submitting application:', error);
      await Swal.fire({ icon: 'error', title: 'Greška', text: 'Dogodila se greška prilikom slanja prijave. Molimo pokušajte ponovno.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Učitavanje...</div>
      </div>
    );
  }

  if (!natjecanje) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-500">Događanje nije pronađeno</div>
      </div>
    );
  }

  // If registrations are closed, show info and prevent form usage
  const prijaveOtvorene = (natjecanje?.phase || 'prijave') === 'prijave';
  const teamMode = (natjecanje?.vrstaNatjecanja || 'individual') === 'team';
  const minMembers = natjecanje?.teamMinMembers || null;
  const maxMembers = natjecanje?.teamMaxMembers || null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 w-full bg-[#666] shadow-md border-b border-gray-200 z-50">
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
            <div className="flex flex-col">
              <span className="text-base font-bold text-white leading-tight">
                III. gimnazija, Split
              </span>
              <span className="text-sm text-white leading-tight hidden sm:block">{/* hide tagline on xs */}
                Prirodoslovno-matematička gimnazija
              </span>
            </div>
          </div>

          {/* Sredina - Naslov PRIJAVA NA DOGAĐANJE */}
          <h1 className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xl lg:text-2xl font-extrabold text-white whitespace-nowrap tracking-wide transition-all duration-300 hover:scale-110 hover:text-[#36b977] cursor-pointer">
            PRIJAVA NA DOGAĐANJE
          </h1>

          {/* Desno - Navigation buttons */}
          <div className="flex items-center gap-4">
            <Link href={`/natjecanja/${id}`}>
              <button className="bg-white text-[#666] font-bold px-4 py-2 rounded hover:bg-[#36b977] hover:text-white transition-colors duration-200">
                ← Nazad
              </button>
            </Link>
            
            <Link href="/natjecanja">
              <button className="bg-white text-[#666] font-bold px-4 py-2 rounded hover:bg-[#36b977] hover:text-white transition-colors duration-200 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                </svg>
                Početna
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile title below header */}
      <div className="md:hidden px-4 py-3 bg-white border-b border-gray-200">
        <h1 className="text-xl font-extrabold text-[#36b977] text-center tracking-wide">PRIJAVA NA DOGAĐANJE</h1>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Competition Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-2 border-[#36b977]">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Prijavljujete se na:</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-xl font-semibold text-[#36b977]">{natjecanje.naziv}</h3>
            <p className="text-gray-600 mt-2">
              <strong>Datum:</strong> {natjecanje.datum}
            </p>
            <p className="text-gray-600">
              <strong>Kategorija:</strong> {natjecanje.kategorija}
            </p>
            {natjecanje.opis && (
              <p className="text-gray-600 mt-2">
                <strong>Opis:</strong> {natjecanje.opis}
              </p>
            )}
          </div>
        </div>

        {!prijaveOtvorene ? (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-yellow-800 mb-2">Prijave su zatvorene</h2>
            <p className="text-yellow-700 mb-4">
              {natjecanje.phase === 'aktivan' 
                ? 'Događanje je u tijeku, prijave više nisu moguće.'
                : 'Događanje je završilo, prijave nisu moguće.'}
            </p>
            <Link href={`/natjecanja/${id}`}>
              <button className="bg-white text-[#666] font-bold px-4 py-2 rounded hover:bg-[#36b977] hover:text-white transition-colors duration-200">
                ← Nazad na detalje
              </button>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Podaci za prijavu</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Ako je timsko događanje, prikaži kontrole za tim */}
              {teamMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Naziv ekipe/razreda *</label>
                    <input
                      name="nazivGrupe"
                      type="text"
                      value={formData.nazivGrupe}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#36b977] focus:border-[#36b977] text-gray-900 bg-white"
                      placeholder="npr. 3.b TIM A"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Članovi ekipe</label>
                      <button type="button" onClick={addMember} className="px-3 py-1 bg-[#36b977] text-white rounded-md text-sm hover:bg-green-600">+ Dodaj člana</button>
                    </div>
                    <div className="space-y-3">
                      {formData.clanoviGrupe.map((m, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                          <input
                            type="text"
                            placeholder="Ime"
                            value={m.ime}
                            onChange={(e) => handleMemberChange(idx, 'ime', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#36b977]"
                            required
                          />
                          <input
                            type="text"
                            placeholder="Prezime"
                            value={m.prezime}
                            onChange={(e) => handleMemberChange(idx, 'prezime', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#36b977]"
                            required
                          />
                          <select
                            value={m.razred}
                            onChange={(e) => handleMemberChange(idx, 'razred', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#36b977] text-gray-900 bg-white"
                            required
                          >
                            <option value="" disabled>Razred</option>
                            <option value="1.a">1.a</option>
                            <option value="1.b">1.b</option>
                            <option value="1.c">1.c</option>
                            <option value="2.a">2.a</option>
                            <option value="2.b">2.b</option>
                            <option value="2.c">2.c</option>
                            <option value="3.a">3.a</option>
                            <option value="3.b">3.b</option>
                            <option value="3.c">3.c</option>
                            <option value="4.a">4.a</option>
                            <option value="4.b">4.b</option>
                            <option value="4.c">4.c</option>
                            <option value="Ostalo">Ostalo</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                // Inače prikaži standardnu individualnu formu
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="ime" className="block text-sm font-medium text-gray-700 mb-2">
                        Ime *
                      </label>
                      <input
                        id="ime"
                        name="ime"
                        type="text"
                        value={formData.ime}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#36b977] focus:border-[#36b977] text-gray-900 bg-white"
                        placeholder="Unesite ime"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="prezime" className="block text-sm font-medium text-gray-700 mb-2">
                        Prezime *
                      </label>
                      <input
                        id="prezime"
                        name="prezime"
                        type="text"
                        value={formData.prezime}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#36b977] focus:border-[#36b977] text-gray-900 bg-white"
                        placeholder="Unesite prezime"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email adresa *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#36b977] focus:border-[#36b977] text-gray-900 bg-white"
                      placeholder="ime.prezime@email.com"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="razred" className="block text-sm font-medium text-gray-700 mb-2">
                      Razred
                    </label>
                    <select
                      id="razred"
                      name="razred"
                      value={formData.razred}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#36b977] focus:border-[#36b977] text-gray-900 bg-white"
                    >
                      <option value="">Izaberite razred</option>
                      <option value="1.a">1.a</option>
                      <option value="1.b">1.b</option>
                      <option value="1.c">1.c</option>
                      <option value="2.a">2.a</option>
                      <option value="2.b">2.b</option>
                      <option value="2.c">2.c</option>
                      <option value="3.a">3.a</option>
                      <option value="3.b">3.b</option>
                      <option value="3.c">3.c</option>
                      <option value="4.a">4.a</option>
                      <option value="4.b">4.b</option>
                      <option value="4.c">4.c</option>
                      <option value="Ostalo">Ostalo</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="kontakt" className="block text-sm font-medium text-gray-700 mb-2">
                      Kontakt telefon
                    </label>
                    <input
                      id="kontakt"
                      name="kontakt"
                      type="tel"
                      value={formData.kontakt}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#36b977] focus:border-[#36b977] text-gray-900 bg-white"
                      placeholder="Unesite broj telefona (opcionalno)"
                    />
                  </div>

                  <div>
                    <label htmlFor="dodatneInformacije" className="block text-sm font-medium text-gray-700 mb-2">
                      Dodatne informacije
                    </label>
                    <textarea
                      id="dodatneInformacije"
                      name="dodatneInformacije"
                      rows={4}
                      value={formData.dodatneInformacije}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#36b977] focus:border-[#36b977] text-gray-900 bg-white resize-none"
                      placeholder="Ukoliko imate dodatne informacije ili pitanja, unesite ih ovdje (opcionalno)"
                    />
                  </div>
                </>
              )}

              {/* Info box */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="text-blue-600 flex-shrink-0">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Napomena</h3>
                    <p className="text-blue-700">
                      Vaša prijava će biti pregledana od strane organizatora događanja. 
                      Za dodatne informacije o statusu prijave, obratite se organizatoru događanja ili profesoru informatike.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#36b977] text-white py-3 px-6 rounded-lg font-medium text-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-[#36b977] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Šalje se prijava...' : 'Pošalji prijavu'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
