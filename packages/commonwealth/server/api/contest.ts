import { trpc } from '@hicommonwealth/adapters';
import { Contest } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  getAllContests: trpc.query(Contest.GetAllContests, trpc.Tag.Community),
  createContestMetadata: trpc.command(
    Contest.CreateContestManagerMetadata,
    trpc.Tag.Community,
  ),
  updateContestMetadata: trpc.command(
    Contest.UpdateContestManagerMetadata,
    trpc.Tag.Community,
  ),
  cancelContestMetadata: trpc.command(
    Contest.CancelContestManagerMetadata,
    trpc.Tag.Community,
  ),
  getContestLog: trpc.query(Contest.GetContestLog, trpc.Tag.Community),
  getFarcasterCasts: trpc.query(
    Contest.GetFarcasterContestCasts,
    trpc.Tag.Community,
  ),
  farcasterWebhook: trpc.command(
    Contest.FarcasterCastCreatedWebhook,
    trpc.Tag.Integration,
  ),
});
