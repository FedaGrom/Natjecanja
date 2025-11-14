import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  deleteDoc, 
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../src/firebase/config';

const ADMIN_COLLECTION = 'admins';
const REGISTRATION_REQUESTS_COLLECTION = 'registrationRequests';

// Provjeri da li je korisnik admin
export const isAdmin = async (userId) => {
  try {
    const q = query(collection(db, ADMIN_COLLECTION), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Greška pri provjeri admin statusa:", error);
    return false;
  }
};

// Dodaj zahtjev za registraciju
export const dodajZahtjevZaRegistraciju = async (registrationData) => {
  try {
    const docRef = await addDoc(collection(db, REGISTRATION_REQUESTS_COLLECTION), {
      ...registrationData,
      status: 'pending', // pending, approved, rejected
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log("Zahtjev za registraciju dodan s ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Greška pri dodavanju zahtjeva za registraciju: ", error);
    throw error;
  }
};

// Dohvati sve zahtjeve za registraciju (samo za admin)
export const dohvatiZahtjeveZaRegistraciju = async () => {
  try {
    const q = query(collection(db, REGISTRATION_REQUESTS_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const zahtjevi = [];
    
    querySnapshot.forEach((doc) => {
      zahtjevi.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return zahtjevi;
  } catch (error) {
    console.error("Greška pri dohvaćanju zahtjeva za registraciju: ", error);
    throw error;
  }
};

// Odobri/odbaci zahtjev za registraciju
export const azurirajStatusZahtjeva = async (zahtjevId, status, adminNote = '') => {
  try {
    const zahtjevRef = doc(db, REGISTRATION_REQUESTS_COLLECTION, zahtjevId);
    await updateDoc(zahtjevRef, {
      status: status, // 'approved' ili 'rejected'
      adminNote: adminNote,
      processedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log("Status zahtjeva ažuriran: ", zahtjevId);
  } catch (error) {
    console.error("Greška pri ažuriranju statusa zahtjeva: ", error);
    throw error;
  }
};

// Dodaj admin korisnika (samo za super admin)
export const dodajAdmina = async (userId, email, displayName) => {
  try {
    const docRef = await addDoc(collection(db, ADMIN_COLLECTION), {
      userId: userId,
      email: email,
      displayName: displayName,
      role: 'admin',
      createdAt: serverTimestamp()
    });
    console.log("Admin dodan s ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Greška pri dodavanju admina: ", error);
    throw error;
  }
};
