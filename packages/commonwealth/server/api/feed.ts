import { trpc } from '@hicommonwealth/adapters';
import { Feed } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  getGlobalActivity: trpc.query(Feed.GetGlobalActivity, trpc.Tag.User),
});
