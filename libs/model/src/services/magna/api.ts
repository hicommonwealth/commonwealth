import { logger } from '@hicommonwealth/core';
import { config } from '../../config';
import {
  ClaimAllocationRequest,
  CreateAllocationRequest,
  MagnaAllocationResponse,
  MagnaClaimResponse,
} from './types';

const log = logger(import.meta);

async function callMagnaApi<Body, Response>(
  path: string,
  body?: Body,
): Promise<Response> {
  const method = body ? 'POST' : 'GET';
  const request = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-magna-api-token': config.MAGNA.API_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  };

  const response = await fetch(`${config.MAGNA.API_URL}/${path}`, request);
  const json = await response.json();

  log.info(`${method} /${path}`, {
    status: response.status,
    body,
    response: JSON.stringify(json),
  });

  return json;
}

export async function createAllocation(
  body: CreateAllocationRequest,
): Promise<MagnaAllocationResponse> {
  return callMagnaApi('allocations/create', body);
}

export async function claimAllocation(
  allocationId: string,
  body: ClaimAllocationRequest,
): Promise<MagnaClaimResponse> {
  return callMagnaApi(`allocations/${allocationId}/claim`, body);
}

export async function getAllocation(
  allocationId: string,
): Promise<MagnaAllocationResponse> {
  return callMagnaApi(`allocations/${allocationId}`);
}
