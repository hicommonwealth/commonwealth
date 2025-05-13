import { trpc } from '@hicommonwealth/adapters';
import { Tag } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  createTag: trpc.command(Tag.CreateTag, trpc.Tag.Tag),
  updateTag: trpc.command(Tag.UpdateTag, trpc.Tag.Tag),
  deleteTag: trpc.command(Tag.DeleteTag, trpc.Tag.Tag),
  getTags: trpc.query(Tag.GetTags, trpc.Tag.Tag),
  getTagUsage: trpc.query(Tag.GetTagUsage, trpc.Tag.Tag),
});
