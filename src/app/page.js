import Naslov from "./components/Naslov";
import Image from "next/image";
import Button from "./components/Button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <Naslov tekst="MIOC OPEN 2025"/>
      <div className="mt-4 flex flex-col items-center">
        <Image
          src="/slike/logo.jpg"
          alt="Logo"
          width={200}
          height={200}
          className="rounded-lg border-4 border-gray-300 shadow-lg mb-8"
        />
        <Button className="bg-blue-600 text-white hover:bg-blue-700 mb-4">
          GRUPE
        </Button>
        <Button className="bg-red-600 text-white hover:bg-red-700 mb-4">
          REZULTATI
        </Button>
        <Button className="bg-purple-600 text-white hover:bg-purple-700">
          ELIMINACIJSKA FAZA
        </Button>
      </div>
    </div>
  );
}