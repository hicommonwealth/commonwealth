import { z } from 'zod';

export const SUPPORTED_LANGUAGES = {
  'en-us': { name: 'English (U.S.)', flag: '🇺🇸' },
  'ru-ru': { name: 'Russian', flag: '🇷🇺' },
  'uk-ua': { name: 'Ukrainian', flag: '🇺🇦' },
  'zh-cn': { name: 'Chinese (Simplified)', flag: '🇨🇳' },
  'hi-in': { name: 'Hindi', flag: '🇮🇳' },
  'de-de': { name: 'German', flag: '🇩🇪' },
  'tr-tr': { name: 'Turkish', flag: '🇹🇷' },
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

export const languageSchema = z.object({
  currentLanguage: z.enum([
    'en-us',
    'ru-ru',
    'uk-ua',
    'zh-cn',
    'hi-in',
    'de-de',
    'tr-tr',
  ]),
});

export type LanguageState = z.infer<typeof languageSchema>;
