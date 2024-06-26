import { ServerControllers } from '../../routing/router';
import { TypedRequest, TypedResponse, success } from '../../types';

type GetPollVotesParams = {
  id: string;
};
type GetPollVotesResponse = null;

export const getPollVotesHandler = async (
  controllers: ServerControllers,
  // @ts-expect-error StrictNullChecks
  req: TypedRequest<null, null, GetPollVotesParams>,
  res: TypedResponse<GetPollVotesResponse>,
) => {
  // @ts-expect-error StrictNullChecks
  const { id: pollId } = req.params;

  const votes = await controllers.polls.getPollVotes({
    pollId: parseInt(pollId, 10),
  });

  return success(res, votes);
};
