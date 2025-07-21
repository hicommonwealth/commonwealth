import { trpc } from '@hicommonwealth/adapters';
import { TokenAllocation } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  updateClaimAddress: trpc.command(
    TokenAllocation.UpdateClaimAddress,
    trpc.Tag.TokenAllocation,
  ),
});
