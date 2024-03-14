import { trpc } from '@hicommonwealth/adapters';
import { Comment } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  searchComments: trpc.query(Comment.SearchComments),
});
