import { devtools, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import { createBoundedUseStore } from '../utils';
import { SUPPORTED_LANGUAGES } from './constants';

interface LanguageStore {
  currentLanguage: keyof typeof SUPPORTED_LANGUAGES;
  setLanguage: (lang: keyof typeof SUPPORTED_LANGUAGES) => void;
  getBrowserLanguage: () => keyof typeof SUPPORTED_LANGUAGES;
  initializeLanguage: () => void;
}

const languageStore = createStore<LanguageStore>()(
  devtools(
    persist(
      (set, get) => ({
        currentLanguage: 'en',
        setLanguage: (lang) => set({ currentLanguage: lang }),
        getBrowserLanguage: () => {
          const browserLang = navigator.language.split('-')[0].toLowerCase();
          return browserLang in SUPPORTED_LANGUAGES
            ? (browserLang as keyof typeof SUPPORTED_LANGUAGES)
            : 'en';
        },
        initializeLanguage: () => {
          const storedState = localStorage.getItem('language-store');
          if (storedState) {
            const { state } = JSON.parse(storedState);
            if (state?.currentLanguage) return;
          }
          set({ currentLanguage: get().getBrowserLanguage() });
        },
      }),
      {
        name: 'language-store',
        partialize: (state) => ({
          currentLanguage: state.currentLanguage,
        }),
      },
    ),
  ),
);

export const useLanguageStore = createBoundedUseStore(languageStore);
export default useLanguageStore;
