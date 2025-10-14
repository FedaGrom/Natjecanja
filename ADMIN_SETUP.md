# Admin Setup Instrukcije

## Kreiranje prvog admin korisnika

Pošto je ovo bootstrap situacija (trebate admin da biste kreirali admina), morate ručno dodati prvog admin korisnika u Firestore bazu.

### Korak 1: Kreirajte admin račun

1. Registrirajte se normalno kroz aplikaciju (vaš zahtjev će biti pending)
2. Idite u Firebase Console → Authentication
3. Kopirajte User UID vašeg računa

### Korak 2: Dodajte admin zapis u Firestore

1. Idite u Firebase Console → Firestore Database
2. Kliknite "Start collection"
3. Collection ID: `admins`
4. Document ID: Ostavite automatski
5. Dodajte sljedeća polja:
   - `userId` (string): Vaš User UID iz Authentication
   - `email` (string): Vaša email adresa
   - `displayName` (string): Vaše ime
   - `role` (string): "admin"
   - `createdAt` (timestamp): Trenutno vrijeme

### Korak 3: Odobriti vlastiti zahtjev za registraciju

1. Idite u collection `registrationRequests`
2. Pronađite svoj zahtjev
3. Uredite dokument i postavite:
   - `status`: "approved"
   - `processedAt`: trenutno vrijeme

### Korak 4: Registrirajte admin račun u Authentication

Sada možete koristiti Firebase Authentication da ručno registrirate admina:

1. Firebase Console → Authentication → Users
2. Add user
3. Unesite email i password

### Korak 5: Testiranje

1. Prijavite se s admin računom
2. U header-u trebate vidjeti "Admin Panel" dugme
3. Možete odobriti/odbaciti nove zahtjeve za registraciju i natjecanja

## Sigurnosna pravila za Firestore

Dodajte ova pravila u Firestore da zaštitite admin funkcionalnost:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Javno čitanje odobrenih natjecanja
    match /natjecanja/{document} {
      allow read: if resource.data.status == 'approved';
      allow create: if request.auth != null;
      allow update, delete: if isAdmin();
    }
    
    // Admin kolekcija - samo čitanje za provjeru
    match /admins/{document} {
      allow read: if request.auth != null;
      allow write: if false; // Samo ručno dodavanje
    }
    
    // Zahtjevi za registraciju
    match /registrationRequests/{document} {
      allow create: if true; // Svi mogu poslati zahtjev
      allow read, update: if isAdmin();
    }
    
    // Funkcija za provjeru admin statusa
    function isAdmin() {
      return request.auth != null && 
             exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
  }
}
```

## Alternativni pristup - Cloud Functions

Za produkciju, preporučuje se korištenje Cloud Functions za:
- Automatsko slanje email obavještenja
- Siguran način kreiranja korisnika
- Validacija podataka
- Audit log funkcionalnost
