import { trpc } from '@hicommonwealth/adapters';
import { Thread } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  getBulkThreads: trpc.query(Thread.GetBulkThreads, trpc.Tag.Thread),
  getThreads: trpc.query(Thread.GetThreads, trpc.Tag.Thread),
});
