import {
  Market,
  MarketFilters,
} from '../views/components/MarketIntegrations/types';

const POLYMARKET_API_BASE_URL = 'https://gamma-api.polymarket.com';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PolymarketMarketResponse = any;

export async function discoverPolymarketMarkets(
  filters: MarketFilters,
): Promise<Market[]> {
  try {
    const url = new URL(`${POLYMARKET_API_BASE_URL}/markets`);
    url.searchParams.append('closed', 'false'); // Only fetch open markets
    // TODO: apply filters

    console.log(url.toString());
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const transformedMarkets: Market[] = data.map(
      (polymarketMarket: PolymarketMarketResponse) => ({
        id: polymarketMarket.id,
        provider: 'polymarket',
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
        imageUrl: polymarketMarket.image || null, // Add image URL
        outcomes: polymarketMarket.outcomes || [], // Add outcomes
        ticker: polymarketMarket.id, // Using id as ticker
        title: polymarketMarket.question, // Using question as title
      }),
    );

    return transformedMarkets;
  } catch (error) {
    console.error('Error fetching Polymarket markets:', error);
    return [];
  }
}
