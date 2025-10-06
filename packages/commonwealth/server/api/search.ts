import { trpc } from '@hicommonwealth/adapters';
import { Search } from '@hicommonwealth/model';

const router = trpc.router({
  searchEntities: trpc.query(Search.SearchEntities, trpc.Tag.Search),
  aggregateContext: trpc.query(Search.AggregateContext, trpc.Tag.Search),
});

export const trpcRouter = router;
export default router;
