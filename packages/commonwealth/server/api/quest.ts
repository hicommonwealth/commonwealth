import { trpc } from '@hicommonwealth/adapters';
import { Quest } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  createQuest: trpc.command(Quest.CreateQuest, trpc.Tag.Quest),
  getQuests: trpc.query(Quest.GetQuests, trpc.Tag.Quest),
  getQuest: trpc.query(Quest.GetQuest, trpc.Tag.Quest),
  updateQuest: trpc.command(Quest.UpdateQuest, trpc.Tag.Quest),
  cancelQuest: trpc.command(Quest.CancelQuest, trpc.Tag.Quest),
});
