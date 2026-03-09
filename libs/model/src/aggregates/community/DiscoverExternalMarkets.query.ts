import { InvalidState, Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { QueryTypes } from 'sequelize';
import { z } from 'zod';
import { config } from '../../config';
import { models } from '../../database';

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
    is_subscribed: false, // Will be updated based on subscription status
  }));
}

async function fetchKalshiEvents(limit: number): Promise<ExternalMarket[]> {
  const url = new URL(KALSHI_API_URL);

  // Kalshi API default limit is 100, max is typically 100
  // Use cursor-based pagination if we need more than 100 items
  const kalshiLimit = Math.min(limit, 100);
  if (kalshiLimit > 0 && kalshiLimit < 100) {
    // Only add limit if it's less than default (100) to avoid potential issues
    url.searchParams.append('limit', String(kalshiLimit));
  }

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new InvalidState(
      `Kalshi API error: ${response.status} - ${errorData.message || response.statusText}`,
    );
  }

  const data: KalshiEventsResponse = await response.json();

  // Filter for open events client-side if API doesn't support status parameter
  const events = data.events || [];
  const openEvents = events.filter(
    (event) => !event.status || event.status === 'open',
  );

  return openEvents.slice(0, limit).map((event) => ({
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
    is_subscribed: false, // Will be updated based on subscription status
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
        community_id,
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

      // Determine which markets are subscribed based on context
      // 1. Site admin (no community_id): check if market is globally featured (in global view)
      // 2. Community admin (with community_id): check if market is subscribed to this community (in subscribed view)
      let subscribedSlugs = new Set<string>();

      if (community_id) {
        // For community admins: check if markets are subscribed to this community
        const subscribedMarkets = await models.sequelize.query<{
          slug: string;
        }>(
          `
          SELECT m.slug
          FROM "CommunityMarkets" cm
          JOIN "Markets" m ON cm.market_id = m.id
          WHERE cm.community_id = :community_id
        `,
          {
            replacements: { community_id },
            type: QueryTypes.SELECT,
          },
        );
        subscribedSlugs = new Set(subscribedMarkets.map((m) => m.slug));
      } else {
        // For site admins: check if markets are globally featured (in global view)
        const globallyFeaturedMarkets = await models.Market.findAll({
          where: {
            is_globally_featured: true,
            ...(provider && provider !== 'all' ? { provider } : {}),
          },
          attributes: ['slug'],
          limit: fetchLimit,
        });
        subscribedSlugs = new Set(globallyFeaturedMarkets.map((m) => m.slug));
      }

      // Add is_subscribed flag to each market based on context
      allMarkets = allMarkets.map((market) => ({
        ...market,
        is_subscribed: subscribedSlugs.has(market.slug),
      }));

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
