import { z } from 'zod';
import { EVM_ADDRESS_STRICT, PG_INT } from '../utils';

export const ClaimAddressView = z.object({
  user_id: PG_INT,
  address: EVM_ADDRESS_STRICT.nullish(),
  tokens: z.coerce.number().nullish(),
  magna_synced_at: z
    .date()
    .or(z.string())
    .nullish()
    .describe('When the address was synced with magna and made not updatable.'),
});

export const GetClaimAddress = {
  input: z.void(),
  output: ClaimAddressView.nullish(),
};
