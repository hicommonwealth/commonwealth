import { PollAttributes } from '../../models/poll';
import { ServerControllers } from '../../routing/router';
import { TypedRequest, TypedResponse, success } from '../../types';

type CreateThreadPollParams = {
  id: string;
};
export type CreateThreadPollBody = {
  prompt: string;
  options: string;
  custom_duration?: string;
};
export type CreateThreadPollResponse = PollAttributes;

export const createThreadPollHandler = async (
  controllers: ServerControllers,
  req: TypedRequest<CreateThreadPollBody, null, CreateThreadPollParams>,
  res: TypedResponse<CreateThreadPollResponse>
) => {
  const chain = req.chain;
  const { id: threadId } = req.params;
  const { prompt, options, custom_duration } = req.body;

  const poll = await controllers.threads.createThreadPoll({
    user: req.user,
    address: req.address,
    chain,
    threadId: parseInt(threadId, 10),
    prompt,
    options,
    customDuration: custom_duration,
  });

  return success(res, poll);
};
