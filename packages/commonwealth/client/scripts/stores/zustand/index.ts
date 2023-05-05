import { create } from 'zustand';
import { createStore } from 'zustand/vanilla';

import createTopicsSlice, { TopicsSlice } from './topics';

// appStore can be imported and used outside the React context
export const appStore = createStore<TopicsSlice>((...args) => ({
  ...createTopicsSlice(...args),
}));

// useAppStore can be imported and used only inside the React functional components
const useAppStore = create(appStore);

export default useAppStore;
