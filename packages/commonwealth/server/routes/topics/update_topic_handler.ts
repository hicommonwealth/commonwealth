import { AppError } from '@hicommonwealth/adapters';
import { TopicAttributes } from '@hicommonwealth/model';
import z from 'zod';
import { ServerControllers } from '../../routing/router';
import { TypedRequest, TypedResponse, success } from '../../types';

const Errors = {
  ValidationError: 'Validation error',
};

type UpdateTopicRequestParams = {
  topicId: string;
};
type UpdateTopicRequestBody = Partial<TopicAttributes>;

type UpdateTopicResponse = TopicAttributes;

export const updateTopicHandler = async (
  controllers: ServerControllers,
  req: TypedRequest<UpdateTopicRequestBody, null, UpdateTopicRequestParams>,
  res: TypedResponse<UpdateTopicResponse>,
) => {
  const {
    user,
    community,
    params: { topicId },
    body,
  } = req;

  const validationSchema = z.object({
    id: z.coerce.number(),
    name: z.string().optional(),
    description: z.string().optional(),
    featured_in_sidebar: z.coerce.boolean().nullable().optional(),
    featured_in_new_post: z.coerce.boolean().optional(),
    default_offchain_template: z.string().nullable().optional(),
    telegram: z.string().nullable().optional(),
    group_ids: z.array(z.number()).optional(),
  });

  const validationResult = validationSchema.safeParse({
    id: topicId,
    ...body,
  });
  if (validationResult.success === false) {
    throw new AppError(
      `${Errors.ValidationError}: ${validationResult.error.message}`,
    );
  }

  const [topic, analyticsOptions] = await controllers.topics.updateTopic({
    user,
    community,
    body: validationResult.data,
  });

  controllers.analytics.track(analyticsOptions, req).catch(console.error);

  return success(res, topic);
};
