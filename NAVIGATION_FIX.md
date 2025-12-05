# Popravke za problem navigacije na Vercelu

## Problem:
Na Vercelu se stranica "refreshira" umjesto da navigira na pojedinačno natjecanje kada se klikne.

## Uzroci:
1. **Event propagation konflikti** između Link komponenti
2. **Potencijalni JavaScript errori** koji prekidaju navigaciju
3. **Prefetch problemi** na Vercel serveru
4. **Hydration mismatch** između server i client side

## Implementirane popravke:

### 1. Event propagation kontrola
```javascript
onClick={(e) => {
  e.stopPropagation();
}}
```

### 2. Error handling
```javascript
const handlePrijava = (natjecanje) => {
  try {
    // Navigacija s error handling
    try {
      router.push(url);
    } catch (routerError) {
      console.warn('Router.push failed, using window.location:', routerError);
      window.location.href = url;
    }
  } catch (error) {
    console.error('Error in handlePrijava:', error);
  }
};
```

### 3. Prefetch onemogućen
```javascript
<Link prefetch={false} href={url}>
```

### 4. Separacija click handlera
- Vanjski linkovi koriste `button` s `window.open()`
- Interni linkovi koriste `Link` komponente
- Dodano `e.preventDefault()` gdje je potrebno

### 5. Card wrapper optimizacija
```javascript
<div onClick={(e) => {
  if (e.target === e.currentTarget) {
    e.preventDefault();
  }
}}>
```

### 6. Debug logovi (samo development)
```javascript
if (process.env.NODE_ENV === 'development') {
  console.log('Navigating to:', url);
}
```

## Rezultat:
- Kontroliran event propagation
- Graceful fallback za navigaciju
- Debug mogućnosti u development modu
- Izbjegivanje prefetch problema na Vercelu
- Pouzdaniji routing na production serveru

Ove promjene bi trebale riješiti problem s "refreshiranjem" stranice na Vercelu.
