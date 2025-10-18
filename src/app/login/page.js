"use client";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase/config";
import { useRouter } from "next/navigation";
import Swal from 'sweetalert2';

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful:', userCredential.user.email);
      
      // Show success alert
      await Swal.fire({
        icon: 'success',
        title: 'Uspješna prijava!',
        text: 'Dobro došli',
        timer: 1500,
        showConfirmButton: false
      });
      
      router.push("/natjecanja");
    } catch (err) {
      console.error("Login error:", err);
      let errorMessage = "Pogrešni podaci za prijavu. Provjerite email i lozinku.";
      
      if (err.code === 'auth/invalid-credential') {
        errorMessage = "Neispravni podaci za prijavu. Provjerite email i lozinku.";
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = "Korisnik s ovim email-om ne postoji.";
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = "Pogrešna lozinka.";
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = "Neispravan email format.";
      } else if (err.code === 'auth/user-disabled') {
        errorMessage = "Korisnički račun je onemogućen.";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 border-2 border-[#36b977]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Prijava</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email adresa
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#36b977] focus:border-[#36b977]"
              placeholder="Unesite email adresu"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Lozinka
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#36b977] focus:border-[#36b977]"
              placeholder="Unesite lozinku"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#36b977] text-white py-2 px-4 rounded-md hover:bg-[#24995a] focus:outline-none focus:ring-2 focus:ring-[#36b977] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Prijavljivanje...' : 'Prijavite se'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
            <p className="text-lg font-semibold text-blue-700 mb-2">
              Nemate pristup?
            </p>
            <p className="text-base text-blue-600">
              Obratite se svojem profesoru informatike ili administratoru sustava za registraciju.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
