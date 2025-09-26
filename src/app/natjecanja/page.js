"use client";
import Image from "next/image";
import Button from "../components/Button";
import Link from "next/link";
import { useState } from "react";

export default function Natjecanja() {
  const [selected, setSelected] = useState("");
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="w-full flex items-center px-6 py-2 bg-blue-700 shadow-md relative">
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button className="bg-white text-blue-700 font-bold px-4 py-2 rounded hover:bg-gray-100">
              POČETNA
            </Button>
          </Link>
          <Button className="bg-white text-blue-700 font-bold px-4 py-2 rounded hover:bg-gray-100">
            NATJECANJA
          </Button>
        </div>
        <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-white text-center">
          NATJECANJA
        </h1>
        <div className="ml-auto">
          <Image
            src="/slike/logo.jpg.png"
            alt="Logo"
            width={64}
            height={64}
            className="rounded border-2 border-gray-300 shadow"
          />
        </div>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center">
        <label htmlFor="sportovi" className="text-white text-lg mb-2">Odaberi sport:</label>
        <select
          id="sportovi"
          className="p-2 rounded text-blue-700 font-bold"
          value={selected}
          onChange={e => setSelected(e.target.value)}
        >
          <option value="">-- Odaberi --</option>
          <option value="nogomet">Nogomet</option>
          <option value="rukomet">Rukomet</option>
          <option value="odbojka">Odbojka</option>
          <option value="atletika">Atletika</option>
        </select>
      </div>
    </div>
  );
}
