import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { languageStore } from '../../../../../client/scripts/state/ui/language/language';

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
  };
})();

// Mock window.navigator
const navigatorMock = {
  language: 'en',
};

describe('Language Store', () => {
  beforeAll(() => {
    // Setup global mocks
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    Object.defineProperty(global, 'navigator', {
      value: navigatorMock,
      writable: true,
    });
  });

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset language store to default state
    languageStore.setState({ currentLanguage: 'en' });
  });

  describe('getBrowserLanguage', () => {
    it('should return browser language if supported', () => {
      // Set navigator language to German
      (global.navigator as any).language = 'de';

      const browserLang = languageStore.getState().getBrowserLanguage();
      expect(browserLang).toBe('de');

      // Reset navigator language
      (global.navigator as any).language = 'en';
    });

    it('should return "en" if browser language is not supported', () => {
      // Set navigator language to unsupported language
      (global.navigator as any).language = 'fr';

      const browserLang = languageStore.getState().getBrowserLanguage();
      expect(browserLang).toBe('en');

      // Reset navigator language
      (global.navigator as any).language = 'en';
    });
  });

  describe('initializeLanguage', () => {
    it('should set language from browser if no stored preference', () => {
      // Set navigator language to German
      (global.navigator as any).language = 'de';

      languageStore.getState().initializeLanguage();
      expect(languageStore.getState().currentLanguage).toBe('de');

      // Reset navigator language
      (global.navigator as any).language = 'en';
    });

    it('should keep stored language preference if available', () => {
      // Set stored preference to Turkish
      languageStore.setState({ currentLanguage: 'tr' });
      localStorage.setItem(
        'language-store',
        JSON.stringify({ currentLanguage: 'tr' }),
      );

      // Set navigator language to German
      (global.navigator as any).language = 'de';

      languageStore.getState().initializeLanguage();
      expect(languageStore.getState().currentLanguage).toBe('tr');

      // Reset navigator language
      (global.navigator as any).language = 'en';
    });
  });
});
