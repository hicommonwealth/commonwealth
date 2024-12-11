import { TranslationService } from './TranslationService';

/**
 * Mock implementation of TranslationService for development and testing.
 * Will be replaced with GoogleTranslationService when credentials are available.
 */
export class MockTranslationService implements TranslationService {
  /**
   * Returns a mock translation of the text by adding language-specific prefix.
   */
  async translateText(text: string, targetLanguage: string): Promise<string> {
    // Simulate API latency
    await new Promise((resolve) => setTimeout(resolve, 500));

    const languagePrefix =
      {
        en: '[EN]',
        ru: '[РУС]',
        uk: '[УКР]',
        zh: '[中文]',
        hi: '[हिंदी]',
        de: '[DE]',
        tr: '[TR]',
      }[targetLanguage] || '[??]';

    return `${languagePrefix} ${text}`;
  }

  /**
   * Returns a mock detected language based on text prefix patterns.
   */
  async detectLanguage(text: string): Promise<string> {
    // Simulate API latency
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Simple mock detection based on common patterns
    if (text.match(/[а-яА-Я]/)) return 'ru';
    if (text.match(/[і-їІ-Ї]/)) return 'uk';
    if (text.match(/[\u4e00-\u9fff]/)) return 'zh';
    if (text.match(/[\u0900-\u097F]/)) return 'hi';
    if (text.match(/[äöüß]/)) return 'de';
    if (text.match(/[çğıöşü]/)) return 'tr';

    // Default to English for any other text
    return 'en';
  }
}
