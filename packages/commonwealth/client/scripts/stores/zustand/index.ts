import { create } from 'zustand';
import { createStore } from 'zustand/vanilla';

import createTopicsSlice, { TopicsSlice } from './topics';

export const vanillaStore = createStore<TopicsSlice>((...args) => ({
  ...createTopicsSlice(...args),
}));

const useAppStore = create(vanillaStore);

export default useAppStore;
