import { AppError } from '@hicommonwealth/adapters';
import z from 'zod';
import { ServerControllers } from '../../routing/router';
import { TypedRequestParams, TypedResponse, success } from '../../types';

const Errors = {
  ValidationError: 'Validation error',
};

type UpdateTopicChannelRequestParams = {
  topicId: string;
  channelId: string;
};

type UpdateTopicChannelResponse = void;

export const updateTopicChannelHandler = async (
  controllers: ServerControllers,
  req: TypedRequestParams<UpdateTopicChannelRequestParams>,
  res: TypedResponse<UpdateTopicChannelResponse>,
) => {
  const { user, chain: community } = req;
  const { topicId, channelId } = req.params;

  const validationSchema = z.object({
    topicId: z.coerce.number(),
    channelId: z.string().optional(),
  });
  const validationResult = validationSchema.safeParse({
    topicId,
    channelId,
  });
  if (validationResult.success === false) {
    throw new AppError(
      `${Errors.ValidationError}: ${validationResult.error.message}`,
    );
  }

  await controllers.topics.updateTopicChannel({
    user,
    community,
    topicId: parseInt(topicId, 10),
    channelId,
  });

  return success(res, null);
};
