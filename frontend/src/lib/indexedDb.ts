export function connectDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = window.indexedDB.open('ComicSeederDB', 3);
    req.onupgradeneeded = (e) => {
      const db = req.result;
      if (!db.objectStoreNames.contains('workPages'))
        db.createObjectStore('workPages', {
          keyPath: 'id'
        });
      if (!db.objectStoreNames.contains('works'))
        db.createObjectStore('works', {
          keyPath: 'id'
        });
      if (!db.objectStoreNames.contains('drawStates')) db.createObjectStore('drawStates');
      if (!db.objectStoreNames.contains('thumbnails')) db.createObjectStore('thumbnails');
    };
    req.onsuccess = (e) => {
      resolve(req.result);
    };
    req.onerror = (e) => {
      reject(e);
    };
  });
}

export function makeDbReqPromise<T>(req: IDBRequest) {
  return new Promise<T>((resolve, reject) => {
    req.onsuccess = (e) => {
      resolve(req.result);
    };
    req.onerror = (e) => {
      reject(e);
    };
  });
}
