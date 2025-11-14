import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth } from '../src/firebase/config';

// Prijava korisnika
export const prijaviKorisnika = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Korisnik uspješno prijavljen:", userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error("Greška pri prijavi:", error);
    throw error;
  }
};

// Registracija novog korisnika - sada kreira zahtjev umjesto direktne registracije
export const posaljiZahtjevZaRegistraciju = async (email, password, displayName) => {
  try {
    // Umjesto direktne registracije, poslati zahtjev adminu
    const { dodajZahtjevZaRegistraciju } = await import('./admin');
    
    const zahtjevId = await dodajZahtjevZaRegistraciju({
      email: email,
      password: password, // Napomena: U produkciji ne bi trebalo spremiti password u plain text
      displayName: displayName,
      requestedAt: new Date().toISOString()
    });
    
    console.log("Zahtjev za registraciju poslan:", zahtjevId);
    return zahtjevId;
  } catch (error) {
    console.error("Greška pri slanju zahtjeva za registraciju:", error);
    throw error;
  }
};

// Registracija korisnika (samo za admin kad odobri zahtjev)
export const registrirajKorisnika = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Ažuriraj profil s display name
    if (displayName) {
      await updateProfile(userCredential.user, {
        displayName: displayName
      });
    }
    
    console.log("Korisnik uspješno registriran:", userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error("Greška pri registraciji:", error);
    throw error;
  }
};

// Odjava korisnika
export const odjaviKorisnika = async () => {
  try {
    await signOut(auth);
    console.log("Korisnik uspješno odjavljen");
  } catch (error) {
    console.error("Greška pri odjavi:", error);
    throw error;
  }
};

// Slušaj promjene stanja autentifikacije
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Dobij trenutnog korisnika
export const getCurrentUser = () => {
  return auth.currentUser;
};
