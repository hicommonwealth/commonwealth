import { z } from 'zod';
import { EVM_ADDRESS_STRICT, PG_INT } from '../utils';

export const UpdateClaimableAddress = {
  input: z.object({
    address_id: PG_INT,
  }),
  output: z.object({
    claim_address: EVM_ADDRESS_STRICT,
  }),
};
