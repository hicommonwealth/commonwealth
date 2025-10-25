import { z } from 'zod';
import { ClaimTxStatus } from '../queries/token-allocation.schemas';
import { EVM_ADDRESS_STRICT, EVM_TRANSACTION_HASH } from '../utils';

export const UpdateClaimAddress = {
  input: z.object({
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
    transaction_hash: EVM_TRANSACTION_HASH,
  }),
  output: z.object({
    status: z.enum(ClaimTxStatus),
    at: z.date().or(z.string()).nullish(),
  }),
};
