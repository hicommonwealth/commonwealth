import { trpc } from '@hicommonwealth/adapters';
import { Thread } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  getBulkThreads: trpc.query(Thread.GetBulkThreads),
});
