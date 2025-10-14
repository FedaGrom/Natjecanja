# Firebase Setup Instrukcije

## Korak 1: Kreirajte Firebase projekt

1. Idite na [Firebase Console](https://console.firebase.google.com/)
2. Kliknite na "Create a project" ili "Add project"
3. Unesite naziv projekta (npr. "natjecanja-app")
4. Omogućite Google Analytics (opcionalno)
5. Kreirajte projekt

## Korak 2: Dodajte web aplikaciju

1. U Firebase konzoli, kliknite na "Web" ikonu (</>)
2. Unesite naziv aplikacije (npr. "Natjecanja Web App")
3. Označite "Also set up Firebase Hosting" ako želite
4. Kliknite "Register app"

## Korak 3: Kopirajte konfiguraciju

1. Kopirajte Firebase config objekt koji će vam se prikazati
2. Otvorite `.env.local` datoteku u vašem projektu
3. Zamijenite placeholder vrijednosti sa stvarnim podacima:

```
NEXT_PUBLIC_FIREBASE_API_KEY=vaš-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=vaš-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=vaš-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=vaš-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=vaš-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=vaš-app-id
```

## Korak 4: Omogućite Firestore

1. U Firebase konzoli, idite na "Firestore Database"
2. Kliknite "Create database"
3. Odaberite "Start in test mode" (za developement)
4. Odaberite lokaciju (Europa - europe-west)
5. Kliknite "Done"

## Korak 5: Omogućite Authentication

1. U Firebase konzoli, idite na "Authentication"
2. Kliknite na "Get started"
3. Idite na tab "Sign-in method"
4. Kliknite na "Email/Password"
5. Omogućite "Email/Password" (prvi prekidač)
6. Možete i omogućiti "Email link (passwordless sign-in)" ako želite
7. Kliknite "Save"

## Korak 6: Postavke sigurnosti (test mode)

Za development, Firestore će biti u test modu. Za produkciju, trebate postaviti sigurnosna pravila.

Test mode pravila:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## Korak 7: Setup Admin korisnika

**VAŽNO**: Pročitajte `ADMIN_SETUP.md` za detaljne instrukcije o kreiranju prvog admin korisnika.

Kratko:
1. Registrirajte se kroz aplikaciju
2. Ručno dodajte admin zapis u Firestore
3. Odobriti vlastiti zahtjev za registraciju

## Korak 8: Pokretanje aplikacije

1. Pokrenite aplikaciju: `npm run dev`
2. Idite na http://localhost:3000/registracija da kreirate novi račun
3. Ili idite na http://localhost:3000/login da se prijavite
4. Idite na http://localhost:3000/kreacija da kreirate natjecanje
5. Provjerite da li se natjecanje prikazuje na stranici natjecanja

## Testiranje admin funkcionalnosti

1. **Registracija**: Korisnici šalju zahtjeve umjesto direktne registracije
2. **Admin panel**: Admin može odobriti/odbaciti zahtjeve na `/admin`
3. **Natjecanja**: Kreirana natjecanja su "pending" dok ih admin ne odobri
4. **Sigurnost**: Samo prijavljeni korisnici mogu kreirati natjecanja
5. **Javni prikaz**: Prikazuju se samo odobrena natjecanja

## Funkcionalnosti admin sistema

- ✅ **Kontrola registracija**: Admin odobrava nove korisnike
- ✅ **Moderacija natjecanja**: Admin odobrava prije objave
- ✅ **Admin panel**: Centralizirano upravljanje `/admin`
- ✅ **Sigurnosne provjere**: Samo admin može pristupiti admin funkcijama
- ✅ **Status praćenje**: Sve ima status (pending/approved/rejected)

## Struktura podataka u Firestore

Natjecanja se spremaju u kolekciju "natjecanja" sa sljedećom strukturom:

```javascript
{
  naziv: "Naziv natjecanja",
  datum: "2024-12-01",
  opis: "Opis natjecanja",
  slika: "/slike/placeholder.jpg",
  createdAt: Firebase.Timestamp,
  updatedAt: Firebase.Timestamp
}
```

## Troubleshooting

- Ako vidite grešku o konfiguraciji, provjerite da li su sve environment varijable postavljene
- Ako se natjecanja ne učitavaju, provjerite Firebase pravila
- Za detaljne greške, pogledajte browser konzolu (F12)
