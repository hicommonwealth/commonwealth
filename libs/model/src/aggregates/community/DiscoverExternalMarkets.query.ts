import { InvalidState, Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { z } from 'zod';
import { config } from '../../config';

const POLYMARKET_API_URL = 'https://gamma-api.polymarket.com/markets';
const KALSHI_API_URL = 'https://api.elections.kalshi.com/trade-api/v2/events';

type ExternalMarket = z.infer<typeof schemas.ExternalMarket>;

interface PolymarketMarketResponse {
  id: string;
  slug: string;
  question: string;
  category?: string;
  closed?: boolean;
  startDate?: string;
  endDate?: string;
  image?: string;
}

interface KalshiEvent {
  event_ticker: string;
  title: string;
  category?: string;
  status?: string;
}

interface KalshiEventsResponse {
  events: KalshiEvent[];
}

async function fetchPolymarketMarkets(
  limit: number,
): Promise<ExternalMarket[]> {
  const url = new URL(POLYMARKET_API_URL);
  url.searchParams.append('closed', 'false');
  url.searchParams.append('limit', String(limit));

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new InvalidState(`Polymarket API error: ${response.status}`);
  }

  const data: PolymarketMarketResponse[] = await response.json();

  if (!Array.isArray(data)) {
    console.error(
      'Polymarket API returned unexpected data format:',
      typeof data,
    );
    return [];
  }

  return data.map((market) => ({
    id: market.id,
    provider: 'polymarket' as const,
    slug: market.slug,
    question: market.question,
    category: market.category || 'Uncategorized',
    status: market.closed ? 'closed' : 'open',
    startTime: market.startDate ? new Date(market.startDate) : null,
    endTime: market.endDate ? new Date(market.endDate) : null,
    imageUrl: market.image || undefined,
  }));
}

async function fetchKalshiMarkets(limit: number): Promise<ExternalMarket[]> {
  const url = new URL(KALSHI_API_URL);
  url.searchParams.append('limit', String(limit));
  url.searchParams.append('status', 'open');

  const response = await fetch(url.toString());
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new InvalidState(
      `Kalshi API error: ${response.status} - ${errorData.message || response.statusText}`,
    );
  }

  const data: KalshiEventsResponse = await response.json();

  return data.events.map((event) => ({
    id: event.event_ticker,
    provider: 'kalshi' as const,
    slug: event.event_ticker,
    question: event.title,
    category: event.category || 'Uncategorized',
    status: event.status || 'open',
    startTime: null,
    endTime: null,
  }));
}

function applyFilters(
  markets: ExternalMarket[],
  search?: string,
  category?: string,
): ExternalMarket[] {
  let filtered = markets;

  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter((market) =>
      market.question.toLowerCase().includes(searchLower),
    );
  }

  if (category && category !== 'all') {
    filtered = filtered.filter((market) => market.category === category);
  }

  return filtered;
}

export function DiscoverExternalMarkets(): Query<
  typeof schemas.DiscoverExternalMarkets
> {
  return {
    ...schemas.DiscoverExternalMarkets,
    auth: [],
    body: async ({ payload }) => {
      if (!config.MARKETS.ENABLED) {
        throw new InvalidState('Markets feature is not enabled');
      }

      const { provider, limit = 200, search, category } = payload;

      let markets: ExternalMarket[] = [];

      if (provider === 'polymarket' || provider === 'all') {
        const polymarketMarkets = await fetchPolymarketMarkets(limit);
        markets = markets.concat(polymarketMarkets);
      }

      if (provider === 'kalshi' || provider === 'all') {
        const kalshiMarkets = await fetchKalshiMarkets(limit);
        markets = markets.concat(kalshiMarkets);
      }

      // Apply filters server-side
      markets = applyFilters(markets, search, category);

      return markets;
    },
  };
}
