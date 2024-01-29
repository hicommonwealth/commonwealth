import { AppError } from '@hicommonwealth/adapters';
import { PollAttributes } from '@hicommonwealth/model';
import { ServerControllers } from '../../routing/router';
import { TypedRequest, TypedResponse, success } from '../../types';

export const Errors = {
  InvalidOptions: 'Invalid options',
};

type CreateThreadPollParams = {
  id: string;
};
export type CreateThreadPollBody = {
  prompt: string;
  options: string[];
  custom_duration?: string;
};
export type CreateThreadPollResponse = PollAttributes;

export const createThreadPollHandler = async (
  controllers: ServerControllers,
  req: TypedRequest<CreateThreadPollBody, null, CreateThreadPollParams>,
  res: TypedResponse<CreateThreadPollResponse>,
) => {
  const { community } = req;
  const { id: threadId } = req.params;
  const { prompt, options, custom_duration } = req.body;

  // validate options
  if (!Array.isArray(options)) {
    throw new AppError(Errors.InvalidOptions);
  }
  for (const option of options) {
    if (typeof option !== 'string') {
      throw new AppError(Errors.InvalidOptions);
    }
  }

  const [poll, analyticsOptions] = await controllers.threads.createThreadPoll({
    user: req.user,
    community,
    threadId: parseInt(threadId, 10) || undefined,
    prompt,
    options,
    customDuration:
      custom_duration === 'Infinite' ? Infinity : parseInt(custom_duration),
  });

  controllers.analytics.track(analyticsOptions, req).catch(console.error);

  return success(res, poll);
};
