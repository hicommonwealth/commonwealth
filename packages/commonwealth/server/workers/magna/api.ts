import { CreateAllocationRequest, MagnaAllocationResponse } from './types';

/**
 * Creates a new allocation in Magna
 */
export async function createAllocation(
  apiUrl: string,
  apiToken: string,
  body: CreateAllocationRequest,
): Promise<MagnaAllocationResponse> {
  const response = await fetch(`${apiUrl}/api/external/v1/allocations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-magna-api-token': apiToken,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create allocation: ${error}`);
  }

  return response.json();
}
