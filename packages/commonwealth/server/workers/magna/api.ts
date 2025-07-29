import type { HistoricalAllocation } from '@hicommonwealth/model/models';
import { MagnaAllocationsResponse } from './types';

export async function bulkInsertAllocations(
  apiUrl: string,
  apiToken: string,
  batch: HistoricalAllocation[],
): Promise<MagnaAllocationsResponse> {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-magna-api-token': apiToken,
    },
    body: JSON.stringify(batch), // TODO: map to Magna Allocation format
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}
