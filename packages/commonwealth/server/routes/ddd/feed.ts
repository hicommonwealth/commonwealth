import { trpc } from '@hicommonwealth/adapters';
import { Feed } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  getUserActivity: trpc.query(Feed.GetUserActivity),
});
