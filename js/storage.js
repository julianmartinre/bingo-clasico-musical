'use strict';
const BingoStorage = (() => {
  let db;
  function open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('bingo90', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('state');
      request.onerror = () => reject(new Error('No se pudo abrir el almacenamiento del navegador.'));
      request.onblocked = () => reject(new Error('Cerrá otras pestañas de Bingo para abrir los datos.'));
      request.onsuccess = () => { db = request.result; db.onversionchange = () => db.close(); resolve(); };
    });
  }
  function read() {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('state', 'readonly');
      const request = tx.objectStore('state').get('current');
      tx.oncomplete = () => {
        try { resolve(request.result ? Bingo.validateState(request.result) : Bingo.emptyState()); }
        catch (error) { reject(error); }
      };
      tx.onerror = () => reject(new Error('No se pudieron leer los datos.'));
    });
  }
  function update(change) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('state', 'readwrite');
      const store = tx.objectStore('state');
      const request = store.get('current');
      let next, failure;
      request.onsuccess = () => {
        try {
          const current = request.result ? Bingo.validateState(request.result) : Bingo.emptyState();
          next = change(structuredClone(current)) || current;
          next = Bingo.validateState(next);
          store.put(next, 'current');
        } catch (error) { failure = error; tx.abort(); }
      };
      tx.oncomplete = () => resolve(next);
      tx.onabort = tx.onerror = () => reject(failure || new Error('No se pudieron guardar los datos. Revisá el espacio disponible.'));
    });
  }
  return { open, read, update };
})();
