import { trpc } from '@hicommonwealth/adapters';
import { Feed } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  getUserActivity: trpc.query(Feed.GetUserActivity, trpc.Tag.User),
  getGlobalActivity: trpc.query(Feed.GetGlobalActivity, trpc.Tag.User),
  getChainActivity: trpc.query(Feed.GetChainActivity, trpc.Tag.User),
});
