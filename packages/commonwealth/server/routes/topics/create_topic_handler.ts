import { AppError } from '@hicommonwealth/core';
import { TopicAttributes } from '@hicommonwealth/model';
import z from 'zod';
import { ServerControllers } from '../../routing/router';
import { TypedRequestBody, TypedResponse, success } from '../../types';

const Errors = {
  ValidationError: 'Validation error',
};

type CreateTopicRequestBody = Partial<TopicAttributes>;

type CreateTopicResponse = TopicAttributes;

export const createTopicHandler = async (
  controllers: ServerControllers,
  req: TypedRequestBody<CreateTopicRequestBody>,
  res: TypedResponse<CreateTopicResponse>,
) => {
  const { user, community, body } = req;

  const validationSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    token_threshold: z.string().optional(),
    featured_in_sidebar: z.coerce.boolean().optional(),
  });

  const validationResult = validationSchema.safeParse(body);
  if (validationResult.success === false) {
    throw new AppError(
      `${Errors.ValidationError}: ${validationResult.error.message}`,
    );
  }

  const [topic, analyticsOptions] = await controllers.topics.createTopic({
    user,
    community,
    body: validationResult.data,
  });

  controllers.analytics.track(analyticsOptions, req).catch(console.error);

  return success(res, topic);
};
