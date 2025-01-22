import { createBoundedUseStore } from 'state/ui/utils';
import { devtools, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

export const SUPPORTED_LANGUAGES = {
  EN: {
    value: 'en',
    label: 'English',
    flag: '🇺🇸',
    abbr: 'EN',
  },
  RU: {
    value: 'ru',
    label: 'Русский',
    flag: '🇷🇺',
    abbr: 'RU',
  },
  DE: {
    value: 'de',
    label: 'Deutsch',
    flag: '🇩🇪',
    abbr: 'DE',
  },
  UK: {
    value: 'uk',
    label: 'Українська',
    flag: '🇺🇦',
    abbr: 'UK',
  },
  VI: {
    value: 'vi',
    label: 'Tiếng Việt',
    flag: '🇻🇳',
    abbr: 'VI',
  },
  TR: {
    value: 'tr',
    label: 'Türkçe',
    flag: '🇹🇷',
    abbr: 'TR',
  },
  HI: {
    value: 'hi',
    label: 'हिन्दी',
    flag: '🇮🇳',
    abbr: 'HI',
  },
  CN: {
    value: 'cn',
    label: '简体中文',
    flag: '🇨🇳',
    abbr: 'CN',
  },
} as const;

export type SupportedLanguageKey = keyof typeof SUPPORTED_LANGUAGES;
export type SupportedLanguage =
  (typeof SUPPORTED_LANGUAGES)[SupportedLanguageKey];

const DEFAULT_LANGUAGE = SUPPORTED_LANGUAGES.EN;

interface LanguagePreferenceStore {
  language: SupportedLanguage;
  getCurrentLanguage: () => SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
}

export const LanguagePreferenceStore = createStore<LanguagePreferenceStore>()(
  devtools(
    persist(
      (set, get) => ({
        language: DEFAULT_LANGUAGE,
        getCurrentLanguage: () => get().language,
        setLanguage: (language: SupportedLanguage) => {
          const isValidLanguage = Object.values(SUPPORTED_LANGUAGES).some(
            (lang) => lang.value === language.value,
          );
          if (isValidLanguage) {
            set({ language: language });
          }
        },
      }),
      {
        name: 'user-language-preference',
        partialize: (state) => ({
          language: state.language,
        }),
      },
    ),
  ),
);

const useLanguagePreferenceStore = createBoundedUseStore(
  LanguagePreferenceStore,
);

export default useLanguagePreferenceStore;
