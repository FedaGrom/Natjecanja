"use client";
import { useState } from "react";
import Link from "next/link";
import { db } from "../../firebase/config";
import { collection, addDoc } from "firebase/firestore";
import Swal from 'sweetalert2';

export default function Registracija() {
  const [formData, setFormData] = useState({
    ime: "",
    prezime: "",
    email: "",
    password: "",
    razlog: "",
    razred: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validacija
    if (!formData.ime || !formData.prezime || !formData.email || !formData.password || !formData.razlog) {
      await Swal.fire({
        icon: 'error',
        title: 'Greška',
        text: 'Molimo unesite sve potrebne podatke'
      });
      setIsSubmitting(false);
      return;
    }

    // Provjera password duljine
    if (formData.password.length < 6) {
      await Swal.fire({
        icon: 'error',
        title: 'Prekratka šifra',
        text: 'Šifra mora imati najmanje 6 znakova'
      });
      setIsSubmitting(false);
      return;
    }

    // Provjera email formata
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      await Swal.fire({
        icon: 'error',
        title: 'Neispravna email adresa',
        text: 'Molimo unesite ispravnu email adresu'
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Dodaj zahtjev u Firestore
      await addDoc(collection(db, 'registrationRequests'), {
        ...formData,
        status: 'pending', // pending, approved, rejected
        createdAt: new Date().toISOString(),
        timestamp: Date.now()
      });

      await Swal.fire({
        icon: 'success',
        title: 'Zahtjev poslan!',
        html: `
          <p>Vaš zahtjev za registraciju je uspješno poslan.</p>
          <p>Administrator će pregledati vaš zahtjev i obavijestiti vas putem email-a.</p>
          <p><strong>Email:</strong> ${formData.email}</p>
        `,
        confirmButtonText: 'U redu'
      });

      // Reset form
      setFormData({
        ime: "",
        prezime: "",
        email: "",
        password: "",
        razlog: "",
        razred: ""
      });

    } catch (error) {
      console.error('Error submitting registration request:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Greška',
        text: 'Dogodila se greška prilikom slanja zahtjeva. Molimo pokušajte ponovno.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <span className="text-sm text-white leading-tight">
                Prirodoslovno-matematička gimnazija
              </span>
            </div>
          </div>

          {/* Sredina - Naslov REGISTRACIJA */}
          <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl lg:text-3xl font-extrabold text-white whitespace-nowrap tracking-wide transition-all duration-300 hover:scale-110 hover:text-[#36b977] cursor-pointer">
            REGISTRACIJA
          </h1>

          {/* Desno - Home button */}
          <div className="flex items-center gap-4">
            <Link href="/natjecanja">
              <button className="bg-white text-[#666] font-bold px-4 py-2 rounded hover:bg-[#36b977] hover:text-white transition-colors duration-200 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                </svg>
                Početna
              </button>
            </Link>
            
            <Link href="/login">
              <button className="bg-white text-[#666] font-bold px-4 py-2 rounded hover:bg-[#36b977] hover:text-white transition-colors duration-200">
                Prijava
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-2xl mx-auto p-6 pt-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#36b977] mb-2">
              Zahtjev za registraciju
            </h2>
            <p className="text-gray-600">
              Pošaljite zahtjev administratoru za pristup platformi natjecanja
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ime *
                </label>
                <input
                  type="text"
                  name="ime"
                  value={formData.ime}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#36b977] focus:border-transparent"
                  placeholder="Unesite vaše ime"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prezime *
                </label>
                <input
                  type="text"
                  name="prezime"
                  value={formData.prezime}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#36b977] focus:border-transparent"
                  placeholder="Unesite vaše prezime"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email adresa *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#36b977] focus:border-transparent"
                placeholder="ime.prezime@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Šifra *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#36b977] focus:border-transparent"
                placeholder="Unesite šifru (najmanje 6 znakova)"
                required
                minLength="6"
              />
              <p className="text-sm text-gray-500 mt-1">Šifra mora imati najmanje 6 znakova</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Razred (opcionalno)
              </label>
              <select
                name="razred"
                value={formData.razred}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#36b977] focus:border-transparent"
              >
                <option value="">Odaberite razred</option>
                <option value="1a">1.a</option>
                <option value="1b">1.b</option>
                <option value="1c">1.c</option>
                <option value="1d">1.d</option>
                <option value="1e">1.e</option>
                <option value="1f">1.f</option>
                <option value="2a">2.a</option>
                <option value="2b">2.b</option>
                <option value="2c">2.c</option>
                <option value="2d">2.d</option>
                <option value="2e">2.e</option>
                <option value="2f">2.f</option>
                <option value="3a">3.a</option>
                <option value="3b">3.b</option>
                <option value="3c">3.c</option>
                <option value="3d">3.d</option>
                <option value="3e">3.e</option>
                <option value="3f">3.f</option>
                <option value="4a">4.a</option>
                <option value="4b">4.b</option>
                <option value="4c">4.c</option>
                <option value="4d">4.d</option>
                <option value="4e">4.e</option>
                <option value="4f">4.f</option>
                <option value="nastavnik">Nastavnik</option>
                <option value="ostalo">Ostalo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Razlog registracije *
              </label>
              <textarea
                name="razlog"
                value={formData.razlog}
                onChange={handleChange}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#36b977] focus:border-transparent resize-vertical"
                placeholder="Opišite zašto se želite registrirati na platformu natjecanja (npr. želim organizirati natjecanje iz glazbe, želim sudjelovati u kvizovima, itd.)"
                required
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Napomena:</p>
                  <p>
                    Vaš zahtjev će biti pregledan od strane administratora. 
                    Bit ćete obavješteni putem email-a o odluci u roku od 2-3 radna dana.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#36b977] text-white font-bold py-4 px-6 rounded-lg hover:bg-green-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Šalje se zahtjev...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Pošalji zahtjev
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Već imate račun? {" "}
              <Link href="/login" className="text-[#36b977] hover:underline font-medium">
                Prijavite se
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
