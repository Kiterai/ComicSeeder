import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { ToolHandler } from '@/components/workedit/tools/ToolHandler';
import { MoveToolHandler } from '@/components/workedit/tools/MoveToolHandler';
import { PenToolHandler } from '@/components/workedit/tools/PenToolHandler';
import { EraserToolHandler } from '@/components/workedit/tools/EraserToolHandler';
import { WordToolHandler } from '@/components/workedit/tools/WordToolHandler';

export type DrawMode = 'move' | 'pen' | 'eraser' | 'word';

export const useDrawMode = defineStore('drawMode', () => {
  const wordTool = ref<WordToolHandler>(new WordToolHandler());
  const toolHandlers = {
    move: new MoveToolHandler(),
    pen: new PenToolHandler(),
    eraser: new EraserToolHandler(),
    word: wordTool.value
  };
  const mode = ref<DrawMode>('pen');
  const currentToolHandler = computed<ToolHandler>(() => {
    return toolHandlers[mode.value];
  });

  const changeMode = (newmode: DrawMode) => {
    if (mode.value == newmode) return;

    mode.value = newmode;
  };
  return { mode, changeMode, currentToolHandler, wordTool };
});
