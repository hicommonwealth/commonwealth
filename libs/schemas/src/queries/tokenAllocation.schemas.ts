import { z } from 'zod';
import { Address } from '../entities';
import { EVM_ADDRESS_STRICT, PG_INT } from '../utils';

export const GetClaimAddress = {
  input: z.void(),
  output: Address.or(
    z.object({
      user_id: PG_INT,
      address: EVM_ADDRESS_STRICT,
    }),
  ).or(z.void()),
};
