"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Preusmjeri odmah na stranicu događanja
    router.push("/natjecanja");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f6f6]">
      <div className="text-center">
        <div className="text-2xl font-bold text-[#36b977] mb-4">
          Preusmjeravanje...
        </div>
        <div className="text-gray-600">
          Molimo pričekajte dok vas preusmjeravamo na stranicu školskih događanja.
        </div>
      </div>
    </div>
  );
}