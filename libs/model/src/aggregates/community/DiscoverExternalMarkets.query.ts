import { InvalidState, Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { z } from 'zod';
import { config } from '../../config';

// Use /events endpoint for grouped markets (not /markets which returns individual outcomes)
const POLYMARKET_API_URL = 'https://gamma-api.polymarket.com/events';
const KALSHI_API_URL = 'https://api.elections.kalshi.com/trade-api/v2/events';

type ExternalMarket = z.infer<typeof schemas.ExternalMarket>;

interface PolymarketEventResponse {
  id: string;
  slug: string;
  title: string;
  closed?: boolean;
  active?: boolean;
  startDate?: string;
  endDate?: string;
  image?: string;
}

interface KalshiEvent {
  event_ticker: string;
  series_ticker: string;
  title: string;
  sub_title?: string;
  category?: string;
  status?: string;
}

interface KalshiEventsResponse {
  events: KalshiEvent[];
}

async function fetchPolymarketEvents(limit: number): Promise<ExternalMarket[]> {
  const url = new URL(POLYMARKET_API_URL);
  url.searchParams.append('closed', 'false');
  url.searchParams.append('active', 'true');
  url.searchParams.append('limit', String(limit));

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new InvalidState(`Polymarket API error: ${response.status}`);
  }

  const data: PolymarketEventResponse[] = await response.json();

  if (!Array.isArray(data)) {
    console.error(
      'Polymarket API returned unexpected data format:',
      typeof data,
    );
    return [];
  }

  return data.map((event) => ({
    id: event.id,
    provider: 'polymarket' as const,
    slug: event.slug,
    question: event.title,
    category: 'Uncategorized', // Events endpoint doesn't include category
    status: event.closed ? 'closed' : 'open',
    startTime: event.startDate ? new Date(event.startDate) : null,
    endTime: event.endDate ? new Date(event.endDate) : null,
    imageUrl: event.image || undefined,
  }));
}

async function fetchKalshiEvents(limit: number): Promise<ExternalMarket[]> {
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
    imageUrl: `https://d1lvyva3zy5u58.cloudfront.net/series-images-webp/${event.series_ticker}.webp`,
    subTitle: event.sub_title,
  }));
}

function applyFilters(
  markets: ExternalMarket[],
  search?: string,
  category?: string,
  status?: string,
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

  if (status && status !== 'all') {
    filtered = filtered.filter((market) => market.status === status);
  }

  return filtered;
}

function sortMarkets(
  markets: ExternalMarket[],
  sortOrder: 'newest' | 'oldest' | 'ending-soon' | 'starting-soon' = 'newest',
): ExternalMarket[] {
  const sorted = [...markets];

  switch (sortOrder) {
    case 'newest':
      return sorted.sort((a, b) => {
        const aTime = a.startTime?.getTime() || 0;
        const bTime = b.startTime?.getTime() || 0;
        return bTime - aTime; // Descending (newest first)
      });

    case 'oldest':
      return sorted.sort((a, b) => {
        const aTime = a.startTime?.getTime() || 0;
        const bTime = b.startTime?.getTime() || 0;
        return aTime - bTime; // Ascending (oldest first)
      });

    case 'ending-soon':
      return sorted.sort((a, b) => {
        const aTime = a.endTime?.getTime() || Number.MAX_SAFE_INTEGER;
        const bTime = b.endTime?.getTime() || Number.MAX_SAFE_INTEGER;
        return aTime - bTime; // Ascending (ending soon first)
      });

    case 'starting-soon':
      return sorted.sort((a, b) => {
        const aTime = a.startTime?.getTime() || Number.MAX_SAFE_INTEGER;
        const bTime = b.startTime?.getTime() || Number.MAX_SAFE_INTEGER;
        return aTime - bTime; // Ascending (starting soon first)
      });

    default:
      return sorted;
  }
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

      const {
        provider,
        limit = 20,
        cursor = 1,
        search,
        category,
        status = 'all',
        sortOrder = 'newest',
      } = payload;

      const fetchLimit = 500;
      let allMarkets: ExternalMarket[] = [];

      if (provider === 'polymarket' || provider === 'all') {
        const polymarketMarkets = await fetchPolymarketEvents(fetchLimit);
        allMarkets = allMarkets.concat(polymarketMarkets);
      }

      if (provider === 'kalshi' || provider === 'all') {
        const kalshiMarkets = await fetchKalshiEvents(fetchLimit);
        allMarkets = allMarkets.concat(kalshiMarkets);
      }

      const filteredMarkets = applyFilters(
        allMarkets,
        search,
        category,
        status,
      );
      const sortedMarkets = sortMarkets(filteredMarkets, sortOrder);

      const offset = limit * (cursor - 1);
      const paginatedMarkets = sortedMarkets.slice(offset, offset + limit);

      return schemas.buildPaginatedResponse(
        paginatedMarkets,
        filteredMarkets.length,
        {
          limit,
          cursor,
        },
      );
    },
  };
}
