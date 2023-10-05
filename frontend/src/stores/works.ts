import { connectDb } from '@/lib/indexedDb';
import { defineStore } from 'pinia';
import { ref } from 'vue';

type WorkData = {
  id: string;
  title: string;
  pageNum: number;
  createdAt: string;
  updatedAt: string;
};

export const useWorks = defineStore('works', () => {
  const works = ref<WorkData[]>([]);

  const generateNewId = () => {
    return works.value.length.toString(); // TODO: uuid
  };

  const addWork = () => {
    const newId = generateNewId();
    const newWork = {
      id: newId,
      title: 'untitled',
      pageNum: 1,
      createdAt: '-',
      updatedAt: '-'
    };

    connectDb().then((db) => {
      const tra = db.transaction('works', 'readwrite');
      const objStore = tra.objectStore('works');
      objStore.add(newWork);
    });

    works.value.push(newWork);
    return newId;
  };

  connectDb().then((db) => {
    const tra = db.transaction('works', 'readonly');
    const objStore = tra.objectStore('works');
    const req = objStore.getAll();
    req.onsuccess = (e) => {
      for (const workOnDb of req.result) {
        works.value.push(workOnDb);
      }
    };
  });

  return { works, addWork };
});
