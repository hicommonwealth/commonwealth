import { trpc } from '@hicommonwealth/adapters';
import { Feed } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  getUserActivity: trpc.query(Feed.GetUserActivity),
  // getGlobalActivity: trpc.query(Feed.GetGlobalActivity),
  getChainActivity: trpc.query(Feed.GetChainActivity),
});
