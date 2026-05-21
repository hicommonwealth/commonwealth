import { describe, expect, test } from 'vitest';
import { getExternalMarketUrl } from '../../../client/scripts/views/components/MarketIntegrations/types';

describe('getExternalMarketUrl', () => {
  describe('Polymarket URLs', () => {
    test('should construct correct URL for Polymarket events', () => {
      const url = getExternalMarketUrl('polymarket', 'will-trump-win-2024');
      expect(url).toBe('https://polymarket.com/event/will-trump-win-2024');
    });

    test('should handle slugs with special characters', () => {
      const url = getExternalMarketUrl(
        'polymarket',
        'bitcoin-above-100k-by-end-of-2024',
      );
      expect(url).toBe(
        'https://polymarket.com/event/bitcoin-above-100k-by-end-of-2024',
      );
    });

    test('should ignore question parameter for Polymarket', () => {
      const url = getExternalMarketUrl(
        'polymarket',
        'some-slug',
        'Will something happen?',
      );
      expect(url).toBe('https://polymarket.com/event/some-slug');
    });
  });

  describe('Kalshi URLs', () => {
    test('should construct correct URL with base ticker, title slug, and full ticker', () => {
      const url = getExternalMarketUrl(
        'kalshi',
        'KXERUPTSUPER-0',
        'Will a supervolcano erupt before 2050?',
      );
      expect(url).toBe(
        'https://kalshi.com/markets/kxeruptsuper/will-a-supervolcano-erupt-before-2050/kxeruptsuper-0',
      );
    });

    test('should handle tickers with alphanumeric suffixes', () => {
      const url = getExternalMarketUrl(
        'kalshi',
        'kxmamdanimention-26feb07',
        'What will Zorhan Mamdani say?',
      );
      expect(url).toBe(
        'https://kalshi.com/markets/kxmamdanimention/what-will-zorhan-mamdani-say/kxmamdanimention-26feb07',
      );
    });

    test('should handle uppercase tickers and convert to lowercase', () => {
      const url = getExternalMarketUrl(
        'kalshi',
        'KXBTCUSD-1',
        'Will Bitcoin hit $100,000?',
      );
      expect(url).toBe(
        'https://kalshi.com/markets/kxbtcusd/will-bitcoin-hit-100000/kxbtcusd-1',
      );
    });

    test('should handle tickers without suffix', () => {
      const url = getExternalMarketUrl(
        'kalshi',
        'KXPRES24',
        'Presidential election 2024',
      );
      // When there's no -N suffix, the full ticker equals base ticker
      expect(url).toBe(
        'https://kalshi.com/markets/kxpres24/presidential-election-2024/kxpres24',
      );
    });

    test('should handle empty question string', () => {
      const url = getExternalMarketUrl('kalshi', 'KXTEST-0', '');
      expect(url).toBe('https://kalshi.com/markets/kxtest//kxtest-0');
    });

    test('should handle missing question parameter', () => {
      const url = getExternalMarketUrl('kalshi', 'KXTEST-0');
      expect(url).toBe('https://kalshi.com/markets/kxtest//kxtest-0');
    });
  });

  describe('Edge cases', () => {
    test('should handle empty slug for Polymarket', () => {
      const url = getExternalMarketUrl('polymarket', '');
      expect(url).toBe('https://polymarket.com/event/');
    });

    test('should handle question with only special characters for Kalshi', () => {
      const url = getExternalMarketUrl('kalshi', 'KXTEST-0', '???!!!');
      expect(url).toBe('https://kalshi.com/markets/kxtest//kxtest-0');
    });
  });
});
