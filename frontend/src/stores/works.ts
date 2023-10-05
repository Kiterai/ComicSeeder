import { connectDb, makeDbReqPromise } from '@/lib/indexedDb';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

type WorkData = {
  id: string;
  title: string;
  pageIds: string[];
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
      pageIds: [],
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
    loaded: computed(() => {
      return loaded.value;
    })
  };
});
