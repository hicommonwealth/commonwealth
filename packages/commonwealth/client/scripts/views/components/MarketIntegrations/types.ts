export const MARKET_PROVIDERS = ['kalshi', 'polymarket'] as const;
export type MarketProvider = (typeof MARKET_PROVIDERS)[number];

export interface Market {
  id: string; // Kalshi uses 'ticker' for a unique ID
  provider: MarketProvider;
  slug: string; // Kalshi uses 'ticker' as a unique identifier, so it can be slug
  question: string; // Kalshi uses 'title'
  category: string;
  status: string;
  startTime: Date | null; // Kalshi uses 'open_time'
  endTime: Date | null; // Kalshi uses 'close_time'
  imageUrl?: string; // Optional image URL for the market
}

export interface MarketFilters {
  search: string;
  provider: MarketProvider | 'all';
  category: string | 'all';
}

/**
 * Converts a title/question to a URL-friendly slug.
 * @param text - The text to slugify
 * @returns A lowercase, hyphenated slug
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Extracts the base event ticker from a Kalshi market ticker.
 * Kalshi tickers have format like "KXERUPTSUPER-0" where "-0" is the market suffix.
 * @param ticker - The full market ticker
 * @returns The base event ticker (lowercase)
 */
function getKalshiBaseTicker(ticker: string): string {
  // Remove the -N suffix (e.g., "-0", "-1", "-26feb07")
  const baseTicker = ticker.replace(/-[a-z0-9]+$/i, '');
  return baseTicker.toLowerCase();
}

/**
 * Constructs the external URL for a market based on the provider.
 * @param provider - The market provider ('polymarket' or 'kalshi')
 * @param slug - The market slug/identifier (event_ticker for Kalshi)
 * @param question - The market question/title (required for Kalshi URLs)
 * @returns The full URL to the market page on the provider's website
 */
export function getExternalMarketUrl(
  provider: MarketProvider,
  slug: string,
  question?: string,
): string {
  switch (provider) {
    case 'polymarket':
      return `https://polymarket.com/event/${slug}`;
    case 'kalshi': {
      // Kalshi URL format: /markets/{base_ticker}/{title_slug}/{full_ticker}
      const baseTicker = getKalshiBaseTicker(slug);
      const fullTicker = slug.toLowerCase();
      const titleSlug = question ? slugify(question) : '';
      return `https://kalshi.com/markets/${baseTicker}/${titleSlug}/${fullTicker}`;
    }
  }
}
