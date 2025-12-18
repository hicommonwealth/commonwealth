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
