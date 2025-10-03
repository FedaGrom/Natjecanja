"use client";
import Naslov from "./components/Naslov";
import Image from "next/image";
import Button from "./components/Button";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function Home() {
  const slike = [
    "/slike/slika1.jpg",
    "/slike/slika2.jpg",
    "/slike/slika3.jpg",
    "/slike/slika4.jpg",
    "/slike/slika5.jpg",
  ];
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slike.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slike.length]);

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + slike.length) % slike.length);
  };
  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % slike.length);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
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
              NATJECANJA
            </button>
          </Link>
        </div>
        <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl font-extrabold text-white whitespace-nowrap tracking-wide transition-all duration-300 hover:scale-110 hover:text-[#36b977] cursor-pointer">
          POČETNA
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
      <div className="flex flex-1 flex-col items-center justify-center w-full">
        <div className="w-full max-w-3xl flex flex-col items-center gap-6">
          <div className="w-full aspect-[16/7] bg-white rounded-lg shadow flex items-center justify-center overflow-hidden mb-8 relative border border-gray-200">
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white text-[#36b977] font-bold text-2xl rounded-full w-10 h-10 flex items-center justify-center shadow hover:bg-[#e6f9f0] hover:text-[#24995a] transition-all z-10 border border-[#36b977]"
            >
              {"<"}
            </button>
            <Image
              src={slike[current]}
              alt={`Slika ${current + 1}`}
              width={900}
              height={350}
              className="object-cover w-full h-full aspect-[16/7]"
              style={{
                objectFit: "cover",
                width: "100%",
                height: "100%",
              }}
              priority
            />
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white text-[#36b977] font-bold text-2xl rounded-full w-10 h-10 flex items-center justify-center shadow hover:bg-[#e6f9f0] hover:text-[#24995a] transition-all z-10 border border-[#36b977]"
            >
              {">"}
            </button>
          </div>
          <div className="flex gap-2">
            {slike.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`w-2.5 h-2.5 rounded-full ${
                  current === idx ? "bg-gray-600" : "bg-gray-300"
                }`}
                aria-label={`Idi na sliku ${idx + 1}`}
              />
            ))}
          </div>
        </div>
        
      </div>
    </div>
  );
}