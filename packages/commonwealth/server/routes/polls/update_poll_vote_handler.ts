import { VoteAttributes } from '../../models/vote';
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
  req: TypedRequest<UpdatePollBody, null, UpdatePollVoteParams>,
  res: TypedResponse<UpdatePollVoteResponse>
) => {
  const { id: pollId } = req.params;
  const { option } = req.body;

  const vote = await controllers.polls.updatePollVote({
    user: req.user,
    address: req.address,
    community: req.chain,
    pollId: parseInt(pollId, 10),
    option,
  });

  return success(res, vote);
};
