import {
  Market,
  MarketFilters,
} from '../views/components/MarketIntegrations/types';

const KALSHI_API_BASE_URL = 'https://api.elections.kalshi.com/trade-api/v2';

export async function discoverKalshiMarkets(
  filters: MarketFilters,
): Promise<Market[]> {
  const url = new URL(`${KALSHI_API_BASE_URL}/markets`);
  url.searchParams.append('limit', '100'); // Fetch up to 100 markets

  // Map filters to Kalshi API parameters
  if (filters.search) {
    url.searchParams.append('tickers', filters.search); // Assuming search maps to tickers
    // Kalshi API also has event_ticker and series_ticker. For simplicity, we'll use tickers for now.
  }
  // No direct mapping for 'category' filter in current Kalshi API spec, would need to filter client-side or use a different endpoint.

  // NOTE: This initial implementation assumes public markets do not require authentication.
  // If the API requires authentication even for public market data, API keys (e.g., KALSHI_API_KEY)
  // would need to be set in environment variables and passed as headers.
  // Example: headers: { 'Authorization': `Bearer ${process.env.KALSHI_API_KEY}` }

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Kalshi API error: ${response.status} - ${errorData.message || response.statusText}`,
      );
    }
    const data = await response.json();

    // Transform Kalshi market data to our common Market interface
    const transformedMarkets: Market[] = data.markets.map(
      (kalshiMarket: any) => ({
        id: kalshiMarket.ticker, // Use ticker as ID for Kalshi markets
        provider: 'kalshi',
        slug: kalshiMarket.ticker, // Use ticker as slug
        question: kalshiMarket.title,
        category: kalshiMarket.category || 'Uncategorized', // Kalshi market might have a category
        status: kalshiMarket.status,
        startTime: kalshiMarket.open_time
          ? new Date(kalshiMarket.open_time)
          : null,
        endTime: kalshiMarket.close_time
          ? new Date(kalshiMarket.close_time)
          : null,
      }),
    );

    return transformedMarkets;
  } catch (error) {
    console.error('Error fetching Kalshi markets:', error);
    throw error;
  }
}
