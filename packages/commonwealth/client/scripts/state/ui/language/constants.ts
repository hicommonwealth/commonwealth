import { z } from 'zod';

export const SUPPORTED_LANGUAGES = {
  'en-us': { name: 'English (U.S.)', flag: '🇺🇸', abbr: 'EN' },
  'ru-ru': { name: 'Russian', flag: '🇷🇺', abbr: 'RU' },
  'uk-ua': { name: 'Ukrainian', flag: '🇺🇦', abbr: 'UA' },
  'zh-cn': { name: 'Chinese (Simplified)', flag: '🇨🇳', abbr: 'CN' },
  'hi-in': { name: 'Hindi', flag: '🇮🇳', abbr: 'HI' },
  'de-de': { name: 'German', flag: '🇩🇪', abbr: 'DE' },
  'tr-tr': { name: 'Turkish', flag: '🇹🇷', abbr: 'TR' },
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
