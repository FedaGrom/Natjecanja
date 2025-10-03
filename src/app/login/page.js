"use client";
import Link from "next/link";

export default function Login() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-white">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm flex flex-col gap-6 border-2 border-[#36b977]">
        <h1 className="text-2xl font-bold text-center text-[#36b977] mb-4">Prijava</h1>
        <form className="flex flex-col gap-4">
          <label htmlFor="username" className="text-[#36b977] font-bold text-lg">Korisničko ime</label>
          <input
            id="username"
            type="text"
            placeholder="Unesi korisničko ime"
            className="border border-[#36b977] rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#36b977] text-black bg-white font-semibold"
          />
          <label htmlFor="password" className="text-[#36b977] font-bold text-lg">Lozinka</label>
          <input
            id="password"
            type="password"
            placeholder="Unesi lozinku"
            className="border border-[#36b977] rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#36b977] text-black bg-white font-semibold"
          />
          <button type="submit" className="bg-[#36b977] text-white font-bold py-2 rounded hover:bg-[#24995a] transition-all">
            Prijavi se
          </button>
        </form>
        <Link href="/" className="text-center text-sm text-[#36b977] hover:underline">Natrag na početnu</Link>
      </div>
    </div>
  );
}
