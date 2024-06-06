import { VoteAttributes } from '@hicommonwealth/model';
import { ServerControllers } from '../../routing/router';
import { TypedRequest, TypedResponse, success } from '../../types';

type UpdatePollVoteParams = {
  id: string;
};
type UpdatePollBody = {
  option: string;
};
type UpdatePollVoteResponse = VoteAttributes;

export const updatePollVoteHandler = async (
  controllers: ServerControllers,
  // @ts-expect-error StrictNullChecks
  req: TypedRequest<UpdatePollBody, null, UpdatePollVoteParams>,
  res: TypedResponse<UpdatePollVoteResponse>,
) => {
  // @ts-expect-error StrictNullChecks
  const { id: pollId } = req.params;
  // @ts-expect-error StrictNullChecks
  const { option } = req.body;

  const [vote, analyticsOptions] = await controllers.polls.updatePollVote({
    // @ts-expect-error StrictNullChecks
    user: req.user,
    // @ts-expect-error StrictNullChecks
    address: req.address,
    pollId: parseInt(pollId, 10),
    option,
  });

  controllers.analytics.track(analyticsOptions, req).catch(console.error);

  return success(res, vote);
};
