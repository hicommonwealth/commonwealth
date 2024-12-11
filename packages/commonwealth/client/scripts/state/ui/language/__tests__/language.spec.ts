import { beforeEach, describe, expect, it } from 'vitest';
import { languageStore } from '../language';

describe('Language Store', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Reset language store to default state
    languageStore.setState({ currentLanguage: 'en' });
  });

  describe('getBrowserLanguage', () => {
    it('should return browser language if supported', () => {
      // Mock navigator.language
      const originalNavigator = window.navigator;
      Object.defineProperty(window, 'navigator', {
        value: { ...originalNavigator, language: 'de' },
        configurable: true,
      });

      const browserLang = languageStore.getState().getBrowserLanguage();
      expect(browserLang).toBe('de');

      // Restore original navigator
      Object.defineProperty(window, 'navigator', {
        value: originalNavigator,
        configurable: true,
      });
    });

    it('should return "en" if browser language is not supported', () => {
      // Mock unsupported language
      const originalNavigator = window.navigator;
      Object.defineProperty(window, 'navigator', {
        value: { ...originalNavigator, language: 'fr' },
        configurable: true,
      });

      const browserLang = languageStore.getState().getBrowserLanguage();
      expect(browserLang).toBe('en');

      // Restore original navigator
      Object.defineProperty(window, 'navigator', {
        value: originalNavigator,
        configurable: true,
      });
    });
  });

  describe('initializeLanguage', () => {
    it('should set language from browser if no stored preference', () => {
      // Mock German browser language
      const originalNavigator = window.navigator;
      Object.defineProperty(window, 'navigator', {
        value: { ...originalNavigator, language: 'de' },
        configurable: true,
      });

      languageStore.getState().initializeLanguage();
      expect(languageStore.getState().currentLanguage).toBe('de');

      // Restore original navigator
      Object.defineProperty(window, 'navigator', {
        value: originalNavigator,
        configurable: true,
      });
    });

    it('should keep stored language preference if available', () => {
      // Set stored preference to Turkish
      languageStore.setState({ currentLanguage: 'tr' });

      // Mock different browser language
      const originalNavigator = window.navigator;
      Object.defineProperty(window, 'navigator', {
        value: { ...originalNavigator, language: 'de' },
        configurable: true,
      });

      languageStore.getState().initializeLanguage();
      expect(languageStore.getState().currentLanguage).toBe('tr');

      // Restore original navigator
      Object.defineProperty(window, 'navigator', {
        value: originalNavigator,
        configurable: true,
      });
    });
  });
});
