import { InvalidState, Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { z } from 'zod';
import { config } from '../../config';

const POLYMARKET_API_URL = 'https://gamma-api.polymarket.com/markets';

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

      const { provider } = payload;

      if (provider === 'polymarket') {
        const url = new URL(POLYMARKET_API_URL);
        url.searchParams.append('closed', 'false');
        url.searchParams.append('limit', '200');

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

        return data.map(
          (market): z.infer<typeof schemas.ExternalMarket> => ({
            id: market.id,
            provider: 'polymarket',
            slug: market.slug,
            question: market.question,
            category: market.category || 'Uncategorized',
            status: market.closed ? 'closed' : 'open',
            startTime: market.startDate ? new Date(market.startDate) : null,
            endTime: market.endDate ? new Date(market.endDate) : null,
            imageUrl: market.image || undefined,
          }),
        );
      }

      return [];
    },
  };
}
