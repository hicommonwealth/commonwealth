import { useQuery } from '@tanstack/react-query';
import { ExternalEndpoints } from 'state/api/config';
import {
  Market,
  MarketFilters,
} from 'views/components/MarketIntegrations/types';

const KALSHI_MARKETS_STALE_TIME = 5 * 60 * 1_000; // 5 minutes

interface KalshiEvent {
  event_ticker: string;
  title: string;
  category?: string;
  status?: string;
}

interface KalshiEventsResponse {
  events: KalshiEvent[];
}

export const discoverKalshiMarkets = async (
  _filters: MarketFilters,
): Promise<Market[]> => {
  const eventsUrl = new URL(ExternalEndpoints.kalshi.events);
  eventsUrl.searchParams.append('limit', '200'); // Fetch up to 200 events
  eventsUrl.searchParams.append('status', 'open'); // Only fetch open events
  // TODO: apply filters

  const eventsResponse = await fetch(eventsUrl.toString());
  if (!eventsResponse.ok) {
    const errorData = await eventsResponse.json();
    throw new Error(
      `Kalshi Events API error: ${eventsResponse.status} - ${errorData.message || eventsResponse.statusText}`,
    );
  }

  const eventsData: KalshiEventsResponse = await eventsResponse.json();
  return eventsData.events.map((event: KalshiEvent) => ({
    id: event.event_ticker,
    provider: 'kalshi' as const,
    slug: event.event_ticker,
    question: event.title,
    category: event.category || 'Uncategorized',
    status: event.status || 'open',
    startTime: null,
    endTime: null,
  }));
};

interface UseDiscoverKalshiMarketsQueryProps {
  filters: MarketFilters;
  enabled?: boolean;
}

const useDiscoverKalshiMarketsQuery = ({
  filters,
  enabled = true,
}: UseDiscoverKalshiMarketsQueryProps) => {
  return useQuery<Market[], Error>({
    queryKey: [ExternalEndpoints.kalshi.events, 'kalshiMarkets', filters],
    queryFn: () => discoverKalshiMarkets(filters),
    staleTime: KALSHI_MARKETS_STALE_TIME,
    enabled,
  });
};

export default useDiscoverKalshiMarketsQuery;
