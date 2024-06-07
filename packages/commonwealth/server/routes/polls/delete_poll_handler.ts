import { ServerControllers } from '../../routing/router';
import { TypedRequest, TypedResponse, success } from '../../types';

type DeletePollParams = {
  id: string;
};
export type DeletePollResponse = null;

export const deletePollHandler = async (
  controllers: ServerControllers,
  // @ts-expect-error StrictNullChecks
  req: TypedRequest<null, null, DeletePollParams>,
  res: TypedResponse<DeletePollResponse>,
) => {
  // @ts-expect-error StrictNullChecks
  const { id: pollId } = req.params;

  await controllers.polls.deletePoll({
    // @ts-expect-error StrictNullChecks
    user: req.user,
    // @ts-expect-error StrictNullChecks
    address: req.address,
    pollId: parseInt(pollId, 10),
  });

  return success(res, null);
};
