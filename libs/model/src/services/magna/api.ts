import { config } from '../../config';
import {
  ClaimAllocationRequest,
  CreateAllocationRequest,
  MagnaAllocationResponse,
  MagnaClaimResponse,
} from './types';

/**
 * Creates a new allocation in Magna
 */
export async function createMagnaAllocation(
  body: CreateAllocationRequest,
): Promise<MagnaAllocationResponse> {
  const request = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-magna-api-token': config.MAGNA!.API_KEY,
    },
    body: JSON.stringify(body),
  };

  const response = await fetch(
    `${config.MAGNA!.API_URL}/api/external/v1/allocations/create`,
    request,
  );

  return response.json();
}

/**
 * Claims a magna allocation
 */
export async function claimMagnaAllocation(
  allocationId: string,
  body: ClaimAllocationRequest,
): Promise<MagnaClaimResponse> {
  const request = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-magna-api-token': config.MAGNA!.API_KEY,
    },
    body: JSON.stringify(body),
  };

  const response = await fetch(
    `${config.MAGNA!.API_URL}/api/external/v1/allocations/${allocationId}/claim`,
    request,
  );

  return response.json();
}
