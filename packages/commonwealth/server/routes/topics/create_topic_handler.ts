import { AppError } from '../../../../common-common/src/errors';
import { TopicAttributes } from '../../models/topic';
import { ServerControllers } from '../../routing/router';
import { TypedRequestBody, TypedResponse, success } from '../../types';
import z from 'zod';

const Errors = {
  ValidationError: 'Validation error',
};

type CreateTopicRequestBody = Partial<TopicAttributes>;

type CreateTopicResponse = TopicAttributes;

export const createTopicHandler = async (
  controllers: ServerControllers,
  req: TypedRequestBody<CreateTopicRequestBody>,
  res: TypedResponse<CreateTopicResponse>
) => {
  const { user, chain, body } = req;

  const validationSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    token_threshold: z.string().optional(),
    featured_in_sidebar: z.coerce.boolean().optional(),
    featured_in_new_post: z.coerce.boolean().optional(),
    default_offchain_template: z.string().optional(),
    chain_id: z.string().optional(),
  });

  const validationResult = validationSchema.safeParse(body);
  if (validationResult.success === false) {
    throw new AppError(
      `${Errors.ValidationError}: ${validationResult.error.message}`
    );
  }

  const topic = await controllers.topics.createTopic({
    user,
    chain,
    body: validationResult.data,
  });

  return success(res, topic);
};
