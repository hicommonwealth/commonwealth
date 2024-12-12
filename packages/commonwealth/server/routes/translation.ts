import { TranslationServiceClient } from '@google-cloud/translate';
import { Request, Response } from 'express';
import { z } from 'zod';

const translationClient = new TranslationServiceClient();

// Validation schema for translation request
const translateRequestSchema = z.object({
  text: z.string().min(1),
  targetLanguage: z.string().length(2),
});

/**
 * Translates text using Google Cloud Translation API
 */
export const translateText = async (req: Request, res: Response) => {
  try {
    const validation = translateRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }

    const { text, targetLanguage } = validation.data;
    const [response] = await translationClient.translateText({
      contents: [text],
      targetLanguageCode: targetLanguage,
    });

    if (!response?.translations?.[0]?.translatedText) {
      return res.status(500).json({ error: 'Translation failed' });
    }

    res.json({ translation: response.translations[0].translatedText });
  } catch (error) {
    console.error('Translation failed:', error);
    res.status(500).json({ error: 'Translation failed' });
  }
};

/**
 * Detects language of provided text using Google Cloud Translation API
 */
export const detectLanguage = async (req: Request, res: Response) => {
  try {
    const text = req.body.text;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Invalid text parameter' });
    }

    const [response] = await translationClient.detectLanguage({
      content: text,
    });

    if (!response?.languages?.[0]?.languageCode) {
      return res.status(500).json({ error: 'Language detection failed' });
    }

    res.json({ languageCode: response.languages[0].languageCode });
  } catch (error) {
    console.error('Language detection failed:', error);
    res.status(500).json({ error: 'Language detection failed' });
  }
};
