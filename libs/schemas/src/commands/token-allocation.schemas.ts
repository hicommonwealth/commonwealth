import { z } from 'zod';
import { EVM_ADDRESS_STRICT } from '../utils';

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
    transaction_id: z.string(),
    instructions: z.array(z.string()),
  }),
};
