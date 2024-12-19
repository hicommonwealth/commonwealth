import { createBoundedUseStore } from 'state/ui/utils';
import { devtools, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import { type SupportedLanguage } from './constants';

interface LanguageStore {
  selectedLanguage: SupportedLanguage;
  setSelectedLanguage: (lang: SupportedLanguage) => void;
}

export const languageStore = createStore<LanguageStore>()(
  devtools(
    persist(
      (set) => ({
        selectedLanguage: 'en-us' as SupportedLanguage,
        setSelectedLanguage: (lang) => set({ selectedLanguage: lang }),
      }),
      {
        name: 'language-store',
        partialize: (state: LanguageStore): Partial<LanguageStore> => ({
          selectedLanguage: state.selectedLanguage,
        }),
      },
    ),
  ),
);

const useLanguageStore = createBoundedUseStore(languageStore);
export default useLanguageStore;
