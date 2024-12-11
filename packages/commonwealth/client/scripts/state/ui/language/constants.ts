import { z } from 'zod';

export const SUPPORTED_LANGUAGES = {
  en: { name: 'English', flag: '🇺🇸' },
  de: { name: 'Deutsch', flag: '🇩🇪' },
  ru: { name: 'Русский', flag: '🇷🇺' },
  uk: { name: 'Українська', flag: '🇺🇦' },
  zh: { name: '繁體中文', flag: '🇹🇼' },
  hi: { name: 'हिन्दी', flag: '🇮🇳' },
  tr: { name: 'Türkçe', flag: '🇹🇷' },
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

export const languageSchema = z.object({
  currentLanguage: z.enum(['en', 'de', 'ru', 'uk', 'zh', 'hi', 'tr']),
});

export type LanguageState = z.infer<typeof languageSchema>;
