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
  const works = ref<WorkData[]>([
    {
      id: '1',
      title: 'test1',
      pageNum: 42,
      createdAt: '-',
      updatedAt: '-'
    },
    {
      id: '2',
      title: 'test2',
      pageNum: 17,
      createdAt: '-',
      updatedAt: '-'
    },
    {
      id: '3',
      title: 'test3',
      pageNum: 28,
      createdAt: '-',
      updatedAt: '-'
    }
  ]);

  const generateNewId = () => {
    return works.value.length.toString(); // TODO: uuid
  };

  const addWork = () => {
    const newId = generateNewId();
    works.value.push({
      id: newId,
      title: 'untitled',
      pageNum: 1,
      createdAt: '-',
      updatedAt: '-'
    });
    return newId;
  };

  return { works, addWork };
});
