import { ServerControllers } from '../../routing/router';
import { TypedRequest, TypedResponse, success } from '../../types';

type DeletePollParams = {
  id: string;
};
export type DeletePollResponse = null;

export const deletePollHandler = async (
  controllers: ServerControllers,
  req: TypedRequest<null, null, DeletePollParams>,
  res: TypedResponse<DeletePollResponse>,
) => {
  const { id: pollId } = req.params;

  await controllers.polls.deletePoll({
    user: req.user,
    address: req.address,
    pollId: parseInt(pollId, 10),
  });

  return success(res, null);
};
