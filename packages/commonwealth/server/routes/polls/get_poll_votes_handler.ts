import { ServerControllers } from '../../routing/router';
import { TypedRequest, TypedResponse, success } from '../../types';

type GetPollVotesParams = {
  id: string;
};
type GetPollVotesResponse = null;

export const getPollVotesHandler = async (
  controllers: ServerControllers,
  req: TypedRequest<null, null, GetPollVotesParams>,
  res: TypedResponse<GetPollVotesResponse>
) => {
  const { id: pollId } = req.params;

  const votes = await controllers.polls.getPollVotes({
    pollId: parseInt(pollId, 10),
  });

  return success(res, votes);
};
