import { trpc } from '@hicommonwealth/adapters';
import { Feed } from '@hicommonwealth/model';
import { config } from '../../server/config';

export const trpcRouter = trpc.router({
  getGlobalActivity: trpc.query(Feed.GetGlobalActivity, trpc.Tag.User, {
    ttlSecs: config.NO_GLOBAL_ACTIVITY_CACHE ? undefined : 60 * 5,
  }),
  getUserActivity: trpc.query(Feed.GetUserActivity, trpc.Tag.User),
});
