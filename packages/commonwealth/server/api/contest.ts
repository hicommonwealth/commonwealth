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
  deleteContestMetadata: trpc.command(
    Contest.DeleteContestManagerMetadata,
    trpc.Tag.Community,
  ),
  getContestLog: trpc.query(Contest.GetContestLog, trpc.Tag.Community),
  getFarcasterCasts: trpc.query(
    Contest.GetFarcasterContestCasts,
    trpc.Tag.Community,
  ),
  farcasterWebhook: trpc.command(
    Contest.FarcasterCastWebhook,
    trpc.Tag.Integration,
  ),
  getJudgeStatus: trpc.query(Contest.GetJudgeStatus, trpc.Tag.Community),
  configureNominationsMetadata: trpc.command(
    Contest.ConfigureNominationsMetadata,
    trpc.Tag.Community,
  ),
});
