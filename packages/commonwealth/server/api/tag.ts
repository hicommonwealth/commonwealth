import { trpc } from '@hicommonwealth/adapters';
import { Tag } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  getTags: trpc.query(Tag.GetTags, trpc.Tag.Tag),
});
