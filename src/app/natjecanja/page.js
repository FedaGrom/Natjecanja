"use client";
import Image from "next/image";
import Button from "../components/Button";
import Link from "next/link";
import { useState } from "react";

export default function Natjecanja() {
  const [selected, setSelected] = useState("");
  const [godina, setGodina] = useState("");
  const [search, setSearch] = useState("");
  // Fake array of competitions
  const natjecanja = [
    { id: 1, naziv: "Školsko natjecanje u nogometu", datum: "2024-05-10", slika: "/slike/placeholder.jpg" },
    { id: 2, naziv: "Rukometni turnir", datum: "2024-06-01", slika: "/slike/placeholder.jpg" },
    { id: 3, naziv: "Odbojkaški kup", datum: "2024-06-15", slika: "/slike/placeholder.jpg" },
    { id: 4, naziv: "Atletsko natjecanje", datum: "2024-07-05", slika: "/slike/placeholder.jpg" },
    { id: 5, naziv: "Natjecanje iz matematike", datum: "2024-05-20", slika: "/slike/placeholder.jpg" },
    { id: 6, naziv: "Plivački miting", datum: "2024-06-10", slika: "/slike/placeholder.jpg" },
    { id: 7, naziv: "Teniski turnir", datum: "2024-06-18", slika: "/slike/placeholder.jpg" },
    { id: 8, naziv: "Natjecanje iz kemije", datum: "2024-05-25", slika: "/slike/placeholder.jpg" },
    { id: 9, naziv: "Šahovski turnir", datum: "2024-06-22", slika: "/slike/placeholder.jpg" },
    { id: 10, naziv: "Natjecanje iz informatike", datum: "2024-07-01", slika: "/slike/placeholder.jpg" },
    { id: 11, naziv: "Natjecanje iz biologije", datum: "2024-07-08", slika: "/slike/placeholder.jpg" },
    { id: 12, naziv: "Planinarski izazov", datum: "2024-07-12", slika: "/slike/placeholder.jpg" },
    { id: 13, naziv: "Natjecanje iz fizike", datum: "2024-07-15", slika: "/slike/placeholder.jpg" },
    { id: 14, naziv: "Stolnoteniski turnir", datum: "2024-07-20", slika: "/slike/placeholder.jpg" },
    { id: 15, naziv: "Natjecanje iz povijesti", datum: "2024-07-25", slika: "/slike/placeholder.jpg" },
    { id: 16, naziv: "Natjecanje iz matematike", datum: "2023-05-20", slika: "/slike/placeholder.jpg" },
    { id: 17, naziv: "Rukometni turnir", datum: "2023-06-01", slika: "/slike/placeholder.jpg" },
    { id: 18, naziv: "Odbojkaški kup", datum: "2022-06-15", slika: "/slike/placeholder.jpg" },
    { id: 19, naziv: "Atletsko natjecanje", datum: "2022-07-05", slika: "/slike/placeholder.jpg" },
    { id: 20, naziv: "Badminton turnir", datum: "2024-08-01", slika: "/slike/placeholder.jpg" },
  ];
  // Filter competitions by year and search
  const filtriranaNatjecanja = natjecanja.filter(n => {
    const byYear = godina ? n.datum.startsWith(godina) : true;
    const bySearch = search ? n.naziv.toLowerCase().includes(search.toLowerCase()) : true;
    return byYear && bySearch;
  });

  return (
    <div className="flex flex-col min-h-screen bg-white">
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
          <Link href="/">
            <button className="bg-white text-[#666] font-bold px-4 py-2 rounded hover:bg-[#36b977] hover:text-white transition-colors duration-200">
              POČETNA
            </button>
          </Link>
        </div>
        <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl font-extrabold text-white whitespace-nowrap tracking-wide transition-all duration-300 hover:scale-110 hover:text-[#36b977] cursor-pointer">
          NATJECANJA
        </h1>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <button className="bg-white text-[#666] font-bold px-4 py-2 rounded hover:bg-[#36b977] hover:text-white transition-colors duration-200">
              Prijava
            </button>
          </Link>
          <Image
            src="/slike/logo.jpg.png"
            alt="Logo"
            width={64}
            height={64}
            className="rounded border-2 border-gray-300 shadow bg-white"
          />
        </div>
      </header>
      <div className="w-full flex justify-center py-4 bg-white gap-4">
        <Link href="/kreacija">
          <button className="bg-[#36b977] text-white font-bold px-6 py-2 rounded hover:bg-[#24995a] transition-colors duration-200 mb-2">
            Kreiraj natjecanje
          </button>
        </Link>
        <label htmlFor="godina" className="text-[#36b977] text-lg font-bold mr-2"></label>
        <select
          id="godina"
          className="p-2 rounded text-[#36b977] font-bold bg-white border-[#36b977] border-2 w-40"
          value={godina}
          onChange={e => setGodina(e.target.value)}
        >
          <option value="">Sve godine</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
          <option value="2022">2022</option>
        </select>
        <input
          type="text"
          placeholder="Pretraži natjecanja..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 bg-white text-black rounded px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-green-600 placeholder-gray-500 transition-colors duration-200 hover:border-green-600 hover:bg-green-100 hover:text-green-900 hover:placeholder-green-700"
        />
      </div>
      {/* Render competitions as large rectangles */}
      <div className="flex flex-col items-center gap-4 py-8 w-full">
        {filtriranaNatjecanja.map(natjecanje => (
          <div key={natjecanje.id} className="w-1/2 min-h-[200px] bg-white rounded-xl shadow-lg p-8 border-2 border-[#36b977] flex flex-col items-start justify-center">
            <Image
              src={natjecanje.slika || "/slike/placeholder.jpg"}
              alt={natjecanje.naziv}
              width={600}
              height={192}
              className="w-full h-48 object-cover rounded mb-4 border border-gray-200"
            />
            <span className="text-2xl font-bold text-[#666] mb-2">{natjecanje.naziv}</span>
            <span className="text-lg text-[#36b977]">Datum: {natjecanje.datum}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
