import { trpc } from '@hicommonwealth/adapters';
import { Contest } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  getAllContests: trpc.query(Contest.GetAllContests),
});
