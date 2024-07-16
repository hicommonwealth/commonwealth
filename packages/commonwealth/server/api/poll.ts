import { trpc } from '@hicommonwealth/adapters';
import { Poll } from '@hicommonwealth/model';

export const trpcRouter = trpc.router({
  getPoll: trpc.query(Poll.GetPoll),
  createPoll: trpc.command(Poll.CreatePoll, trpc.Tag.Poll),
  deletePoll: trpc.command(Poll.DeletePoll, trpc.Tag.Poll),
  getPollVote: trpc.query(Poll.GetPollVote),
  updatePollVote: trpc.command(Poll.UpdatePollVote, trpc.Tag.Poll),
});
