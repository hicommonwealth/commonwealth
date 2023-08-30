import { PollAttributes } from 'server/models/poll';
import { ServerControllers } from 'server/routing/router';
import { TypedRequest, TypedResponse, success } from 'server/types';

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
  res: TypedResponse<GetThreadPollsResponse>
) {
  const { id: threadId } = req.params;

  const polls = await controllers.threads.getThreadPolls({
    threadId: parseInt(threadId, 10),
  });

  return success(res, polls);
}
