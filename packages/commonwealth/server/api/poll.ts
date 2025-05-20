import { trpc } from '@hicommonwealth/adapters';
import { Poll } from '@hicommonwealth/model';
import { MixpanelCommunityInteractionEvent } from '../../shared/analytics/types';

export const trpcRouter = trpc.router({
  createPoll: trpc.command(Poll.CreatePoll, trpc.Tag.Poll, [
    trpc.trackAnalytics([
      MixpanelCommunityInteractionEvent.CREATE_POLL,
      ({ community_id }) => ({ community_id }),
    ]),
  ]),
  deletePoll: trpc.command(Poll.DeletePoll, trpc.Tag.Poll),
  createPollVote: trpc.command(Poll.CreatePollVote, trpc.Tag.Poll, [
    trpc.trackAnalytics([
      MixpanelCommunityInteractionEvent.SUBMIT_VOTE,
      ({ community_id }) => ({ community_id }),
    ]),
  ]),
  getPolls: trpc.query(Poll.GetPolls, trpc.Tag.Poll),
  getPollVotes: trpc.query(Poll.GetPollVotes, trpc.Tag.Poll),
});
