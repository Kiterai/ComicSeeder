import { connectDb, makeDbReqPromise } from '@/lib/indexedDb';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export type WorkData = {
  id: string;
  title: string;
  pageIds: string[];
  pageDirection: 'L2R' | 'R2L';
  createdAt: string;
  updatedAt: string;
};

export const useWorks = defineStore('works', () => {
  const works = ref<WorkData[]>([]);

  const generateNewId = () => {
    return new Date().getTime().toString(); // TODO: uuid
  };

  const getNowDateString = () => {
    const now = new Date();
    const yy = now.getFullYear().toString().padStart(4, '0');
    const mm = (now.getMonth() + 1).toString().padStart(2, '0');
    const dd = now.getDate().toString().padStart(2, '0');
    const HH = now.getHours().toString().padStart(2, '0');
    const MM = now.getMinutes().toString().padStart(2, '0');
    const SS = now.getSeconds().toString().padStart(2, '0');
    return `${yy}/${mm}/${dd} ${HH}:${MM}:${SS}`;
  };

  const addWork = async () => {
    const newId = generateNewId();
    const now = getNowDateString();
    const newWork: WorkData = {
      id: newId,
      title: 'untitled',
      pageDirection: 'R2L',
      pageIds: [],
      createdAt: now,
      updatedAt: now
    };

    await connectDb().then((db) => {
      const tra = db.transaction('works', 'readwrite');
      const objStore = tra.objectStore('works');
      objStore.add(newWork);
    });

    works.value.push(newWork);
    return newId;
  };

  const updateWork = async (work: WorkData) => {
    await connectDb().then(async (db) => {
      work.updatedAt = getNowDateString();
      const tra = db.transaction('works', 'readwrite');
      const objStore = tra.objectStore('works');
      await makeDbReqPromise(objStore.put(work));
    });
  };

  const loaded = ref(false);
  connectDb()
    .then((db) => {
      const tra = db.transaction('works', 'readonly');
      const objStore = tra.objectStore('works');
      return makeDbReqPromise<WorkData[]>(objStore.getAll());
    })
    .then((res) => {
      for (const workOnDb of res) {
        works.value.push(workOnDb);
      }
      loaded.value = true;
    });

  return {
    works,
    addWork,
    updateWork,
    loaded: computed(() => {
      return loaded.value;
    })
  };
});
