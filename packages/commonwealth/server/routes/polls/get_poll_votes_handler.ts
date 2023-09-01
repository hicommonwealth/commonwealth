import { ServerControllers } from 'server/routing/router';
import { TypedRequest, TypedResponse, success } from 'server/types';

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

  await controllers.polls.getPollVotes({
    pollId: parseInt(pollId, 10),
  });

  return success(res, null);
};
