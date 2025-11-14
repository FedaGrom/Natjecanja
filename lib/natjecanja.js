import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  deleteDoc, 
  updateDoc,
  query,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../src/firebase/config';

const COLLECTION_NAME = 'natjecanja';

// Dodaj novo natjecanje (će biti pending dok admin ne odobri)
export const dodajNatjecanje = async (natjecanje) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...natjecanje,
      status: 'pending', // pending, approved, rejected
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log("Natjecanje dodano s ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Greška pri dodavanju natjecanja: ", error);
    throw error;
  }
};

// Dohvati samo odobrena natjecanja (za javni prikaz)
export const dohvatiNatjecanja = async () => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME), 
      where('status', '==', 'approved'),
      orderBy('datum', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const natjecanja = [];
    
    querySnapshot.forEach((doc) => {
      natjecanja.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return natjecanja;
  } catch (error) {
    console.error("Greška pri dohvaćanju natjecanja: ", error);
    throw error;
  }
};

// Dohvati sva natjecanja uključujući pending (samo za admin)
export const dohvatiSvaNatjecanja = async () => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const natjecanja = [];
    
    querySnapshot.forEach((doc) => {
      natjecanja.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return natjecanja;
  } catch (error) {
    console.error("Greška pri dohvaćanju svih natjecanja: ", error);
    throw error;
  }
};

// Odobri/odbaci natjecanje (samo za admin)
export const azurirajStatusNatjecanja = async (natjecanjeId, status, adminNote = '') => {
  try {
    const natjecanjeRef = doc(db, COLLECTION_NAME, natjecanjeId);
    await updateDoc(natjecanjeRef, {
      status: status, // 'approved' ili 'rejected'
      adminNote: adminNote,
      processedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log("Status natjecanja ažuriran: ", natjecanjeId);
  } catch (error) {
    console.error("Greška pri ažuriranju statusa natjecanja: ", error);
    throw error;
  }
};

// Obriši natjecanje
export const obrisiNatjecanje = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    console.log("Natjecanje obrisano: ", id);
  } catch (error) {
    console.error("Greška pri brisanju natjecanja: ", error);
    throw error;
  }
};

// Ažuriraj natjecanje
export const azurirajNatjecanje = async (id, updates) => {
  try {
    const natjecanjeRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(natjecanjeRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    console.log("Natjecanje ažurirano: ", id);
  } catch (error) {
    console.error("Greška pri ažuriranju natjecanja: ", error);
    throw error;
  }
};
