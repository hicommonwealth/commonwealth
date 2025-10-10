import { trpc } from '@hicommonwealth/adapters';
import { TokenAllocation } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  updateClaimAddress: trpc.command(
    TokenAllocation.UpdateClaimAddress,
    trpc.Tag.TokenAllocation,
  ),
  getClaimAddress: trpc.query(
    TokenAllocation.GetClaimAddress,
    trpc.Tag.TokenAllocation,
  ),
  getAllocation: trpc.query(
    TokenAllocation.GetAllocation,
    trpc.Tag.TokenAllocation,
  ),
  claimToken: trpc.command(
    TokenAllocation.ClaimToken,
    trpc.Tag.TokenAllocation,
  ),
  updateClaimTransactionHash: trpc.command(
    TokenAllocation.UpdateClaimTransactionHash,
    trpc.Tag.TokenAllocation,
  ),
  claimTokenCliff: trpc.command(
    TokenAllocation.ClaimTokenCliff,
    trpc.Tag.TokenAllocation,
  ),
  updateClaimCliffTransactionHash: trpc.command(
    TokenAllocation.UpdateClaimCliffTransactionHash,
    trpc.Tag.TokenAllocation,
  ),
});
