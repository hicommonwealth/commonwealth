import { trpc } from '@hicommonwealth/adapters';
import { Contest } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  getAllContests: trpc.query(Contest.GetAllContests),
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
});
