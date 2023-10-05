export function connectDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = window.indexedDB.open('ComicSeederDB');
    req.onupgradeneeded = (e) => {
      const db = req.result;
      db.createObjectStore('workPages', {
        keyPath: 'id'
      });
      db.createObjectStore('works', {
        keyPath: 'id'
      });
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
