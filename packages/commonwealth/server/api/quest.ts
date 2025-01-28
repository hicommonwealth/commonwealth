import { trpc } from '@hicommonwealth/adapters';
import { Quest } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  createQuest: trpc.command(Quest.CreateQuest, trpc.Tag.Quest),
  updateQuest: trpc.command(Quest.UpdateQuest, trpc.Tag.Quest),
});
