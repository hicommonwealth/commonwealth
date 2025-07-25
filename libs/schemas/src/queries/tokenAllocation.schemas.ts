import { z } from 'zod';
import { EVM_ADDRESS_STRICT, PG_INT } from '../utils';

export const GetClaimAddress = {
  input: z.void(),
  output: z.union([
    z.object({
      user_id: PG_INT,
      address: EVM_ADDRESS_STRICT,
    }),
    z.undefined(),
  ]),
};
