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
    }, 2500);
    return () => clearInterval(interval);
  }, [slike.length]);

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + slike.length) % slike.length);
  };
  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % slike.length);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="w-full flex items-center justify-between px-6 py-2 bg-[var(--header-bg)] shadow-md border-b border-gray-200 relative">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-start mr-4">
            <span className="text-base font-bold text-black leading-tight">
              III. gimnazija, Split
            </span>
            <span className="text-sm text-black leading-tight">
              Prirodoslovno-matematička gimnazija
            </span>
          </div>
          <Link href="/">
            <button className="bg-white text-black font-bold px-4 py-2 rounded hover:bg-gray-200">
              POČETNA
            </button>
          </Link>
          <Link href="/natjecanja">
            <button className="bg-white text-black font-bold px-4 py-2 rounded hover:bg-gray-200">
              NATJECANJA
            </button>
          </Link>
        </div>
        <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl font-extrabold text-black whitespace-nowrap tracking-wide">
          SPORTSKA TREMA
        </h1>
        <Image
          src="/slike/logo.jpg.png"
          alt="Logo"
          width={64}
          height={64}
          className="rounded border-2 border-gray-300 shadow bg-white"
        />
      </header>
      <div className="flex flex-1 flex-col items-center justify-center w-full">
        <div className="w-full max-w-3xl flex flex-col items-center gap-6">
          <div className="w-full aspect-[16/7] bg-white rounded-lg shadow flex items-center justify-center overflow-hidden mb-8 relative border border-gray-200">
            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-gray-400 text-white rounded-full w-8 h-8 flex items-center justify-center shadow hover:bg-gray-500 transition-all z-10"
            >
              &#8592;
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
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-400 text-white rounded-full w-8 h-8 flex items-center justify-center shadow hover:bg-gray-500 transition-all z-10"
            >
              &#8594;
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