/**
 * Interface for translation services that can be used to translate text content
 * and detect languages in the Commonwealth platform.
 */
export interface TranslationService {
  /**
   * Translates the given text to the specified target language.
   * @param text The text to translate
   * @param targetLanguage The language code to translate to (e.g., 'en', 'es')
   * @returns A promise that resolves to the translated text
   */
  translateText(text: string, targetLanguage: string): Promise<string>;

  /**
   * Detects the language of the given text.
   * @param text The text to analyze
   * @returns A promise that resolves to the detected language code
   */
  detectLanguage(text: string): Promise<string>;
}
