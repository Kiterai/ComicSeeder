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

  const addWork = async () => {
    const newId = generateNewId();
    const now = new Date().toLocaleString();
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
      work.updatedAt = new Date().toLocaleString();
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
