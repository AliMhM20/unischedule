import { UniversityId } from './parsers';

export interface StoredCatalogSource {
  id: string;
  universityId: UniversityId;
  rawHtml: string;
  addedAt: number;
}

const DB_NAME = 'UniSchedule_DB';
const DB_VERSION = 1;
const STORE_NAME = 'catalog_sources';
const FALLBACK_KEY = 'unischedule_raw_sources_v1';

// Open IndexedDB safely
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Fallback helpers for localStorage
function getFallbackSources(): StoredCatalogSource[] {
  try {
    const data = localStorage.getItem(FALLBACK_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.warn('Failed to read from localStorage fallback', e);
    return [];
  }
}

function setFallbackSources(sources: StoredCatalogSource[]): void {
  try {
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(sources));
  } catch (e) {
    console.warn('Failed to save to localStorage fallback (storage full)', e);
  }
}

// Get all stored sources for a university
export async function getCatalogSources(universityId?: UniversityId): Promise<StoredCatalogSource[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const list: StoredCatalogSource[] = req.result || [];
        if (universityId) {
          resolve(list.filter(s => s.universityId === universityId));
        } else {
          resolve(list);
        }
      };
      req.onerror = () => {
        const list = getFallbackSources();
        resolve(universityId ? list.filter(s => s.universityId === universityId) : list);
      };
    });
  } catch {
    const list = getFallbackSources();
    return universityId ? list.filter(s => s.universityId === universityId) : list;
  }
}

// Get count of stored sources
export async function getCatalogSourcesCount(universityId?: UniversityId): Promise<number> {
  const sources = await getCatalogSources(universityId);
  return sources.length;
}

// Fresh catalog import: wipes previous sources and stores the single fresh HTML
export async function saveFreshCatalogSource(universityId: UniversityId, rawHtml: string): Promise<void> {
  const newSource: StoredCatalogSource = {
    id: 'src_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    universityId,
    rawHtml,
    addedAt: Date.now()
  };

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      store.put(newSource);
      tx.oncomplete = () => {
        setFallbackSources([newSource]);
        resolve();
      };
      tx.onerror = () => {
        setFallbackSources([newSource]);
        reject(tx.error);
      };
    });
  } catch {
    setFallbackSources([newSource]);
  }
}

// Append new source
export async function appendCatalogSource(universityId: UniversityId, rawHtml: string): Promise<void> {
  const newSource: StoredCatalogSource = {
    id: 'src_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    universityId,
    rawHtml,
    addedAt: Date.now()
  };

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(newSource);
      tx.oncomplete = () => {
        const list = getFallbackSources();
        setFallbackSources([...list, newSource]);
        resolve();
      };
      tx.onerror = () => {
        const list = getFallbackSources();
        setFallbackSources([...list, newSource]);
        reject(tx.error);
      };
    });
  } catch {
    const list = getFallbackSources();
    setFallbackSources([...list, newSource]);
  }
}

// Clear all sources
export async function clearCatalogSources(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      tx.oncomplete = () => {
        localStorage.removeItem(FALLBACK_KEY);
        resolve();
      };
      tx.onerror = () => {
        localStorage.removeItem(FALLBACK_KEY);
        resolve();
      };
    });
  } catch {
    localStorage.removeItem(FALLBACK_KEY);
  }
}
