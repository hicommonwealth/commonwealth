import { MagnaAllocationsRequest, MagnaAllocationsResponse } from './types';

export async function fetchMagnaAllocations(
  req: MagnaAllocationsRequest,
  apiUrl: string,
  apiToken: string,
): Promise<MagnaAllocationsResponse> {
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-magna-api-token': apiToken,
    },
    body: JSON.stringify(req),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}
