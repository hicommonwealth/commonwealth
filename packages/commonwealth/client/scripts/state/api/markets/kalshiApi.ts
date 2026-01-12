import {
  Market,
  MarketFilters,
} from 'client/scripts/views/components/MarketIntegrations/types';

const KALSHI_API_BASE_URL = 'https://api.elections.kalshi.com/trade-api/v2';

export async function discoverKalshiMarkets(
  filters: MarketFilters,
): Promise<Market[]> {
  const eventsUrl = new URL(`${KALSHI_API_BASE_URL}/events`);
  eventsUrl.searchParams.append('limit', '200'); // Fetch up to 200 events
  eventsUrl.searchParams.append('status', 'open'); // Only fetch open events
  // TODO: apply filters

  try {
    const eventsResponse = await fetch(eventsUrl.toString());
    if (!eventsResponse.ok) {
      const errorData = await eventsResponse.json();
      throw new Error(
        `Kalshi Events API error: ${eventsResponse.status} - ${errorData.message || eventsResponse.statusText}`,
      );
    }
    const eventsData = await eventsResponse.json();
    return eventsData.events.map((event) => ({
      id: event.event_ticker, // Use event_ticker as the ID for the grouped market
      provider: 'kalshi',
      slug: event.event_ticker, // Use event_ticker as slug
      question: event.title, // Use event title as the main question
      category: event.category || 'Uncategorized',
      status: event.status || 'open', // Fallback to first market's status
    }));
  } catch (error) {
    console.error('Error fetching Kalshi markets:', error);
    throw error;
  }
}
