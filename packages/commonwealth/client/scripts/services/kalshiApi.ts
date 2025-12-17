import {
  Market,
  MarketFilters,
} from '../views/components/MarketIntegrations/types';

const KALSHI_API_BASE_URL = 'https://api.elections.kalshi.com/trade-api/v2';

export async function discoverKalshiMarkets(
  filters: MarketFilters,
): Promise<Market[]> {
  const eventsUrl = new URL(`${KALSHI_API_BASE_URL}/events`);
  eventsUrl.searchParams.append('limit', '200'); // Fetch up to 200 events
  eventsUrl.searchParams.append('status', 'open'); // Only fetch open events

  // NOTE: Kalshi /events endpoint does not support search by ticker or category.
  // We will fetch all open events and then filter client-side if needed.

  try {
    const eventsResponse = await fetch(eventsUrl.toString());
    if (!eventsResponse.ok) {
      const errorData = await eventsResponse.json();
      throw new Error(
        `Kalshi Events API error: ${eventsResponse.status} - ${errorData.message || eventsResponse.statusText}`,
      );
    }
    const eventsData = await eventsResponse.json();

    const transformedEvents: Market[] = await Promise.all(
      eventsData.events.map(async (event: any) => {
        // Now fetch markets (bets/outcomes) for each event
        const marketsUrl = new URL(`${KALSHI_API_BASE_URL}/markets`);
        marketsUrl.searchParams.append('event_ticker', event.event_ticker);
        marketsUrl.searchParams.append('status', 'open'); // Only fetch open bets for the event

        const marketsResponse = await fetch(marketsUrl.toString());
        if (!marketsResponse.ok) {
          console.warn(
            `Kalshi Markets API error for event ${event.event_ticker}: ${marketsResponse.status}`,
          );
          return null; // Skip this event if we can't get its markets
        }
        const marketsData = await marketsResponse.json();

        // Extract relevant info from the first market (bet) for dates and image, as they should be consistent across bets of an event
        const firstMarket = marketsData.markets && marketsData.markets[0];

        return {
          id: event.event_ticker, // Use event_ticker as the ID for the grouped market
          provider: 'kalshi',
          slug: event.event_ticker, // Use event_ticker as slug
          question: event.title, // Use event title as the main question
          category: event.category || 'Uncategorized',
          status: event.status || firstMarket?.status || 'open', // Fallback to first market's status
          startTime: firstMarket?.open_time
            ? new Date(firstMarket.open_time)
            : null,
          endTime: firstMarket?.close_time
            ? new Date(firstMarket.close_time)
            : null,
          imageUrl: firstMarket?.image_url || null, // Image from the first market
          outcomes: marketsData.markets?.map((m: any) => m.title) || [], // Use individual market titles as outcomes
          ticker: event.event_ticker,
          title: event.title,
        };
      }),
    );

    // Filter out any null entries that might have resulted from failed markets API calls
    const filteredEvents = transformedEvents.filter(
      (market) => market !== null,
    ) as Market[];

    // Apply client-side filtering for search and category as /events endpoint doesn't support them
    let finalFilteredMarkets = filteredEvents;
    if (filters.search) {
      finalFilteredMarkets = finalFilteredMarkets.filter((market) =>
        market.question.toLowerCase().includes(filters.search.toLowerCase()),
      );
    }
    if (filters.category !== 'all') {
      finalFilteredMarkets = finalFilteredMarkets.filter(
        (market) => market.category === filters.category,
      );
    }

    return finalFilteredMarkets;
  } catch (error) {
    console.error('Error fetching Kalshi markets:', error);
    throw error;
  }
}
