import { PollAttributes } from '../../models/poll';
import { ServerControllers } from '../../routing/router';
import { TypedRequest, TypedResponse, success } from '../../types';

export const Errors = {
  NoThreadId: 'Must provide thread_id',
};

type GetThreadPollsParams = {
  id: string;
};

type GetThreadPollsResponse = PollAttributes[];

export async function getThreadPollsHandler(
  controllers: ServerControllers,
  req: TypedRequest<null, null, GetThreadPollsParams>,
  res: TypedResponse<GetThreadPollsResponse>,
) {
  const { id: threadId } = req.params;

  const polls = await controllers.threads.getThreadPolls({
    threadId: parseInt(threadId, 10) || undefined,
  });

  return success(res, polls);
}
