import { z } from 'zod';
import { EVM_ADDRESS_STRICT, EVM_TRANSACTION_HASH } from '../utils';

export const UpdateClaimAddress = {
  input: z.object({
    event_id: z.string(),
    address: EVM_ADDRESS_STRICT,
  }),
  output: z.object({
    claim_address: EVM_ADDRESS_STRICT,
  }),
};

export const ClaimToken = {
  input: z.object({
    allocation_id: z.string(),
  }),
  output: z.object({
    magna_allocation_id: z.string(),
    from: EVM_ADDRESS_STRICT,
    to: EVM_ADDRESS_STRICT,
    data: z.string(),
    transaction_hash: EVM_TRANSACTION_HASH.nullish(),
  }),
};

export const UpdateClaimTransactionHash = {
  input: z.object({
    event_id: z.string(),
    transaction_hash: EVM_TRANSACTION_HASH,
  }),
  output: z.boolean(),
};
