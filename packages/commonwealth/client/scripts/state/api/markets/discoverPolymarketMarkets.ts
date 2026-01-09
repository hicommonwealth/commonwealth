import { useQuery } from '@tanstack/react-query';
import { ExternalEndpoints } from 'state/api/config';
import {
  Market,
  MarketFilters,
} from 'views/components/MarketIntegrations/types';

const POLYMARKET_MARKETS_STALE_TIME = 5 * 60 * 1_000; // 5 minutes

interface PolymarketMarketResponse {
  id: string;
  slug: string;
  question: string;
  category?: string;
  closed?: boolean;
  startDate?: string;
  endDate?: string;
  image?: string;
  outcomes?: string[];
}

export const discoverPolymarketMarkets = async (
  _filters: MarketFilters,
): Promise<Market[]> => {
  const url = new URL(ExternalEndpoints.polymarket.markets);
  url.searchParams.append('closed', 'false'); // Only fetch open markets
  url.searchParams.append('limit', '200'); // Fetch up to 200 markets
  // TODO: apply filters

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Polymarket API error: ${response.status}`);
  }

  const data: PolymarketMarketResponse[] = await response.json();

  if (!Array.isArray(data)) {
    console.error(
      'Polymarket API returned unexpected data format:',
      typeof data,
    );
    return [];
  }

  return data.map((polymarketMarket: PolymarketMarketResponse) => ({
    id: polymarketMarket.id,
    provider: 'polymarket' as const,
    slug: polymarketMarket.slug,
    question: polymarketMarket.question,
    category: polymarketMarket.category || 'Uncategorized',
    status: polymarketMarket.closed ? 'closed' : 'open',
    startTime: polymarketMarket.startDate
      ? new Date(polymarketMarket.startDate)
      : null,
    endTime: polymarketMarket.endDate
      ? new Date(polymarketMarket.endDate)
      : null,
    imageUrl: polymarketMarket.image || undefined,
  }));
};

interface UseDiscoverPolymarketMarketsQueryProps {
  filters: MarketFilters;
  enabled?: boolean;
}

const useDiscoverPolymarketMarketsQuery = ({
  filters,
  enabled = true,
}: UseDiscoverPolymarketMarketsQueryProps) => {
  return useQuery<Market[], Error>({
    queryKey: [
      ExternalEndpoints.polymarket.markets,
      'polymarketMarkets',
      filters,
    ],
    queryFn: () => discoverPolymarketMarkets(filters),
    staleTime: POLYMARKET_MARKETS_STALE_TIME,
    enabled,
  });
};

export default useDiscoverPolymarketMarketsQuery;
