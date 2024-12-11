import { devtools, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import {
  LanguageState,
  SUPPORTED_LANGUAGES,
  languageSchema,
} from './constants';

interface LanguageStore extends LanguageState {
  setLanguage: (lang: keyof typeof SUPPORTED_LANGUAGES) => void;
}

export const languageStore = createStore<LanguageStore>()(
  devtools(
    persist(
      (set) => ({
        currentLanguage: 'en',
        setLanguage: (lang) => set({ currentLanguage: lang }),
      }),
      {
        name: 'language-storage',
        storage: localStorage,
        partialize: (state) => ({ currentLanguage: state.currentLanguage }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            const result = languageSchema.safeParse(state);
            if (!result.success) {
              console.error('Invalid language state:', result.error);
              return;
            }
          }
        },
      },
    ),
  ),
);

export const useLanguageStore = () => {
  const currentLanguage = languageStore.getState().currentLanguage;
  const setLanguage = languageStore.getState().setLanguage;
  return { currentLanguage, setLanguage };
};
