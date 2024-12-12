import { TranslationServiceClient } from '@google-cloud/translate';
import { TranslationService } from './TranslationService';

export class GoogleTranslationService implements TranslationService {
  private client: TranslationServiceClient;

  constructor() {
    this.client = new TranslationServiceClient();
  }

  async translateText(text: string, targetLanguage: string): Promise<string> {
    try {
      const [response] = await this.client.translateText({
        contents: [text],
        targetLanguageCode: targetLanguage,
      });

      if (!response?.translations?.[0]?.translatedText) {
        throw new Error('Invalid translation response');
      }

      return response.translations[0].translatedText;
    } catch (error) {
      console.error('Translation failed:', error);
      throw new Error('Failed to translate text');
    }
  }

  async detectLanguage(text: string): Promise<string> {
    try {
      const [response] = await this.client.detectLanguage({
        content: text,
      });

      if (!response?.languages?.[0]?.languageCode) {
        throw new Error('Invalid language detection response');
      }

      return response.languages[0].languageCode;
    } catch (error) {
      console.error('Language detection failed:', error);
      throw new Error('Failed to detect language');
    }
  }
}
