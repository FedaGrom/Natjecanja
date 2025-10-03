"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function KreacijaNatjecanja() {
  const [naziv, setNaziv] = useState("");
  const [datum, setDatum] = useState("");
  const [slika, setSlika] = useState(null);
  const handleSubmit = (e) => {
    e.preventDefault();
    // Ovdje ide logika za spremanje natjecanja
    const prikazSlike = slika ? URL.createObjectURL(slika) : "/slike/placeholder.jpg";
    alert(`Natjecanje: ${naziv}\nDatum: ${datum}\nSlika: ${slika ? slika.name : 'placeholder.jpg'}`);
    setNaziv("");
    setDatum("");
    setSlika(null);
  };

  return (
    <>
      <header className="w-full flex items-center justify-between px-6 py-2 bg-[#666] shadow-md border-b border-gray-200 relative">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-start mr-4">
            <span className="text-base font-bold text-white leading-tight">
              III. gimnazija, Split
            </span>
            <span className="text-sm text-white leading-tight">
              Prirodoslovno-matematička gimnazija
            </span>
          </div>
          <Link href="/natjecanja">
            <button className="bg-white text-[#666] font-bold px-4 py-2 rounded hover:bg-[#36b977] hover:text-white transition-colors duration-200">
              Natrag
            </button>
          </Link>
        </div>
        <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl font-extrabold text-white whitespace-nowrap tracking-wide transition-all duration-300 hover:scale-110 hover:text-[#36b977] cursor-pointer">
          Kreiraj natjecanje
        </h1>
        <div className="flex items-center gap-4">
          <Image
            src="/slike/logo.jpg.png"
            alt="Logo"
            width={64}
            height={64}
            className="rounded border-2 border-gray-300 shadow bg-white"
          />
        </div>
      </header>
      <div className="w-full flex flex-col items-center mt-12 bg-white">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 w-full max-w-md bg-gray-50 p-8 rounded-xl shadow"
        >
          <label className="font-bold text-[#666]">Naziv natjecanja:</label>
          <input
            type="text"
            value={naziv}
            onChange={(e) => setNaziv(e.target.value)}
            className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#36b977]"
            required
          />
          <label className="font-bold text-[#666]">Datum:</label>
          <input
            type="date"
            value={datum}
            onChange={(e) => setDatum(e.target.value)}
            className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#36b977]"
            required
          />
          <label className="font-bold text-[#666]">Slika:</label>
          <input
            type="file"
            accept="image/*"
            onChange={e => setSlika(e.target.files[0])}
            className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#36b977]"
          />
          <button
            type="submit"
            className="bg-[#36b977] text-white font-bold px-4 py-2 rounded hover:bg-[#24995a] transition-colors duration-200"
          >
            Spremi
          </button>
        </form>
      </div>
    </>
  );
}
