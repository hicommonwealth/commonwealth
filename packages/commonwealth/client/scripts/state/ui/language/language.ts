import { createBoundedUseStore } from 'state/ui/utils';
import { devtools, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import { SUPPORTED_LANGUAGES } from './constants';

interface LanguageStore {
  currentLanguage: keyof typeof SUPPORTED_LANGUAGES;
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
        name: 'language-store',
        partialize: (state: LanguageStore): LanguageStore => ({
          currentLanguage: state.currentLanguage,
          setLanguage: state.setLanguage,
        }),
      },
    ),
  ),
);

const useLanguageStore = createBoundedUseStore(languageStore);
export default useLanguageStore;
