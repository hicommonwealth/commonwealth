import { z } from 'zod';
import { EVM_ADDRESS_STRICT, PG_INT } from '../utils';

export const AllocationStatus = [
  'MISSING_WALLET',
  'NOT_STARTED',
  'CANCELLED',
  'COMPLETED',
  'PENDING_AIRDROP',
  'UP_TO_DATE',
  'CLAIM_AVAILABLE',
  'PENDING_FUNDING',
] as const;

export const ClaimAddressView = z.object({
  user_id: PG_INT,
  address: EVM_ADDRESS_STRICT.nullish(),
  token: z.string(),
  description: z.string(),
  tokens: z.coerce.number().nullish(),
  magna_allocation_id: z.string().nullish(),
  magna_synced_at: z
    .date()
    .or(z.string())
    .nullish()
    .describe('When the address was synced with magna and made not updatable.'),
  magna_claimed_at: z
    .date()
    .or(z.string())
    .nullish()
    .describe('When the allocation was claimed by the user.'),
  magna_claim_tx_hash: z.string().nullish(),
});

export const GetClaimAddress = {
  input: z.void(),
  output: ClaimAddressView.nullish(),
};

export const GetAllocation = {
  input: z.object({ magna_allocation_id: z.uuid() }),
  output: z
    .object({
      magna_allocation_id: z.uuid(),
      walletAddress: EVM_ADDRESS_STRICT,
      token: z.string(),
      description: z.string(),
      status: z.enum(AllocationStatus),
      amount: z.number(),
      funded: z.number(),
      claimable: z.number(),
      unlock_start_at: z.date().or(z.string()).nullish(),
    })
    .nullish(),
};
