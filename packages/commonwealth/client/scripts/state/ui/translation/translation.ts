import { devtools } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';
import { GoogleTranslationService } from '../../../services/GoogleTranslationService';
import { MockTranslationService } from '../../../services/MockTranslationService';
import { TranslationService } from '../../../services/TranslationService';
import { SUPPORTED_LANGUAGES } from '../language/constants';

interface TranslationState {
  translations: Record<string, string>;
  pendingTranslations: Set<string>;
  translationService: TranslationService;
  selectedLanguage: keyof typeof SUPPORTED_LANGUAGES;
  setSelectedLanguage: (language: keyof typeof SUPPORTED_LANGUAGES) => void;
  addTranslation: (key: string, translation: string) => void;
  translateText: (text: string, targetLanguage: string) => Promise<string>;
  detectLanguage: (text: string) => Promise<string>;
}

// Initialize translation service based on environment
const translationService = process.env.GOOGLE_CLIENT_ID
  ? new GoogleTranslationService()
  : new MockTranslationService();

export const translationStore = createStore<TranslationState>()(
  devtools(
    (set, get) => ({
      translations: {},
      pendingTranslations: new Set(),
      translationService,
      selectedLanguage: 'en',

      setSelectedLanguage: (language) =>
        set(() => ({
          selectedLanguage: language,
        })),

      addTranslation: (key: string, translation: string) =>
        set((state) => ({
          translations: { ...state.translations, [key]: translation },
          pendingTranslations: new Set(
            Array.from(state.pendingTranslations).filter((k) => k !== key),
          ),
        })),

      translateText: async (text: string, targetLanguage: string) => {
        const key = `${text}:${targetLanguage}`;
        const cached = get().translations[key];
        if (cached) return cached;

        const { pendingTranslations } = get();
        if (pendingTranslations.has(key)) {
          // Wait for pending translation
          while (pendingTranslations.has(key)) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
          return get().translations[key];
        }

        set((state) => ({
          pendingTranslations: new Set([...state.pendingTranslations, key]),
        }));

        try {
          const translation = await get().translationService.translateText(
            text,
            targetLanguage,
          );
          get().addTranslation(key, translation);
          return translation;
        } catch (error) {
          console.error('Translation failed:', error);
          set((state) => ({
            pendingTranslations: new Set(
              Array.from(state.pendingTranslations).filter((k) => k !== key),
            ),
          }));
          throw error;
        }
      },

      detectLanguage: async (text: string) => {
        return get().translationService.detectLanguage(text);
      },
    }),
    { name: 'Translation Store' },
  ),
);
