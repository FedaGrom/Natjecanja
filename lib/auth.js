import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../src/firebase/config';

// Prijava korisnika
export const prijaviKorisnika = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Korisnik uspješno prijavljen:", userCredential.user);

    // Osiguraj da postoji dokument u 'users'
    try {
      const userRef = doc(db, 'users', userCredential.user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: userCredential.user.uid,
          email: userCredential.user.email || email,
          displayName: userCredential.user.displayName || '',
          createdAt: serverTimestamp(),
        });
      }
    } catch (e) {
      console.error('Greška pri sinkronizaciji users dokumenta:', e);
    }

    return userCredential.user;
  } catch (error) {
    console.error("Greška pri prijavi:", error);
    throw error;
  }
};

// Registracija novog korisnika - sada direktno kreira zahtjev (bez dynamic import)
export const posaljiZahtjevZaRegistraciju = async (email, password, displayName) => {
  try {
    const docRef = await addDoc(collection(db, 'registrationRequests'), {
      email,
      password, // u produkciji izbjegavati plain text
      displayName: displayName || '',
      status: 'pending',
      requestedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log("Zahtjev za registraciju poslan:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Greška pri slanju zahtjeva za registraciju:", error);
    throw error;
  }
};

// Registracija korisnika (ako je trebaš koristiti na drugim mjestima)
export const registrirajKorisnika = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }

    const userRef = doc(db, 'users', userCredential.user.uid);
    await setDoc(userRef, {
      uid: userCredential.user.uid,
      email,
      displayName: displayName || '',
      createdAt: serverTimestamp(),
    });

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
