import { PollAttributes } from '@hicommonwealth/model';
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
  // @ts-expect-error StrictNullChecks
  req: TypedRequest<null, null, GetThreadPollsParams>,
  res: TypedResponse<GetThreadPollsResponse>,
) {
  // @ts-expect-error StrictNullChecks
  const { id: threadId } = req.params;

  const polls = await controllers.threads.getThreadPolls({
    // @ts-expect-error StrictNullChecks
    threadId: parseInt(threadId, 10) || undefined,
  });

  return success(res, polls);
}
