/**
 * IndexedDB draft persistence utility.
 * Uses 'InventoryDraftsDB' (version 2) and the 'drafts' object store.
 * Safe for SSR and test environments where indexedDB may be undefined.
 */

let dbPromise: Promise<IDBDatabase> | null = null;

export function getDraftDB(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available in this environment'));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      try {
        // Use version 2 to guarantee onupgradeneeded executes even if version 1 was previously created
        const request = indexedDB.open('InventoryDraftsDB', 2);

        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains('drafts')) {
            db.createObjectStore('drafts');
          }
        };

        request.onsuccess = () => {
          const db = request.result;
          db.onclose = () => {
            dbPromise = null;
          };
          db.onversionchange = () => {
            db.close();
            dbPromise = null;
          };
          resolve(db);
        };

        request.onerror = () => {
          dbPromise = null;
          console.error('IndexedDB open error:', request.error);
          reject(request.error);
        };

        request.onblocked = () => {
          console.warn('IndexedDB InventoryDraftsDB open request blocked by another tab.');
        };
      } catch (err) {
        dbPromise = null;
        reject(err);
      }
    });
  }
  return dbPromise;
}

export async function setDraft(key: string, value: any): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  try {
    const db = await getDraftDB();
    // Deep clone to plain JSON to guarantee no DataCloneError from Angular/RxJS internals
    const cleanValue = JSON.parse(JSON.stringify(value));

    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction('drafts', 'readwrite');
      const store = tx.objectStore('drafts');
      const req = store.put(cleanValue, key);

      tx.oncomplete = () => resolve();
      tx.onerror = () => {
        console.error(`IndexedDB transaction error for key "${key}":`, tx.error);
        reject(tx.error);
      };
      req.onerror = () => {
        console.error(`IndexedDB put error for key "${key}":`, req.error);
        reject(req.error);
      };
    });
  } catch (e) {
    console.error(`IndexedDB save failed for key "${key}":`, e);
  }
}

export async function getDraft<T = any>(key: string): Promise<T | null> {
  if (typeof indexedDB === 'undefined') return null;
  try {
    const db = await getDraftDB();
    return new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction('drafts', 'readonly');
      const store = tx.objectStore('drafts');
      const req = store.get(key);

      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => {
        console.error(`IndexedDB get error for key "${key}":`, req.error);
        reject(req.error);
      };
      tx.onerror = () => {
        console.error(`IndexedDB read transaction error for key "${key}":`, tx.error);
        reject(tx.error);
      };
    });
  } catch (e) {
    console.error(`IndexedDB read failed for key "${key}":`, e);
    return null;
  }
}

export async function removeDraft(key: string): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  try {
    const db = await getDraftDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction('drafts', 'readwrite');
      const store = tx.objectStore('drafts');
      const req = store.delete(key);

      tx.oncomplete = () => resolve();
      tx.onerror = () => {
        console.error(`IndexedDB delete transaction error for key "${key}":`, tx.error);
        reject(tx.error);
      };
      req.onerror = () => {
        console.error(`IndexedDB delete error for key "${key}":`, req.error);
        reject(req.error);
      };
    });
  } catch (e) {
    console.error(`IndexedDB delete failed for key "${key}":`, e);
  }
}
