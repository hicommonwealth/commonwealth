import { trpc } from '@hicommonwealth/adapters';
import { Poll } from '@hicommonwealth/model';
import { MixpanelCommunityInteractionEvent } from '../../shared/analytics/types';

export const trpcRouter = trpc.router({
  createPollVote: trpc.command(Poll.CreatePollVote, trpc.Tag.Poll, [
    trpc.trackAnalytics([
      MixpanelCommunityInteractionEvent.SUBMIT_VOTE,
      ({ community_id }) => ({ community_id }),
    ]),
  ]),
});
