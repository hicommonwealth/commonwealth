export type SupportedLanguage =
  | 'en'
  | 'ru'
  | 'de'
  | 'uk'
  | 'vi'
  | 'tr'
  | 'hi'
  | 'zh';

export const SUPPORTED_LANGUAGES = [
  { label: 'English 🇺🇸', value: 'en' },
  { label: 'Русский 🇷🇺', value: 'ru' },
  { label: 'Deutsch 🇩🇪', value: 'de' },
  { label: 'Українська 🇺🇦', value: 'uk' },
  { label: 'Tiếng Việt 🇻🇳', value: 'vi' },
  { label: 'Türkçe 🇹🇷', value: 'tr' },
  { label: 'हिन्दी 🇮🇳', value: 'hi' },
  { label: '繁體中文 🇹🇼', value: 'zh' },
] as const;

const STORAGE_KEY = 'user-language-preference';
const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export const setLanguagePreference = (language: SupportedLanguage) => {
  localStorage.setItem(STORAGE_KEY, language);
};

export const getLanguagePreference = (): SupportedLanguage => {
  return (
    (localStorage.getItem(STORAGE_KEY) as SupportedLanguage) || DEFAULT_LANGUAGE
  );
};

export const getLanguageLabel = (language: SupportedLanguage): string => {
  return (
    SUPPORTED_LANGUAGES.find((lang) => lang.value === language)?.label ||
    'English 🇺🇸'
  );
};
