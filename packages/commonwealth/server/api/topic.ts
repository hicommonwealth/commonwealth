import { trpc } from '@hicommonwealth/adapters';
import { Topic } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  getTopics: trpc.query(Topic.GetTopics, trpc.Tag.Topic),
});
