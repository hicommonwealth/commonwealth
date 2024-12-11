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

export const languageStore = createStore<LanguageStore>()(
  devtools(
    persist(
      (set) => ({
        currentLanguage: 'en',
        setLanguage: (lang) => set({ currentLanguage: lang }),
        getBrowserLanguage: () => {
          // Get browser language and remove region code if present (e.g., 'en-US' -> 'en')
          const browserLang = navigator.language.split('-')[0].toLowerCase();

          // Check if browser language is supported, return 'en' if not
          return browserLang in SUPPORTED_LANGUAGES
            ? (browserLang as keyof typeof SUPPORTED_LANGUAGES)
            : 'en';
        },
        initializeLanguage: () => {
          const state = languageStore.getState();
          // Only set language from browser if no stored preference exists
          if (!localStorage.getItem('language-store')) {
            state.setLanguage(state.getBrowserLanguage());
          }
        },
      }),
      {
        name: 'language-store',
      },
    ),
  ),
);

const useLanguageStore = createBoundedUseStore(languageStore);
export default useLanguageStore;
