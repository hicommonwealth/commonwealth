import { AppError } from '@hicommonwealth/core';
import { TopicAttributes } from '@hicommonwealth/model';
import { PG_INT, TopicWeightedVoting } from '@hicommonwealth/schemas';
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
    featured_in_new_post: z.coerce.boolean().optional(),
    default_offchain_template: z.string().optional(),
    weighted_voting: z.nativeEnum(TopicWeightedVoting).optional(),
    chain_node_id: PG_INT.optional().describe(
      'token chain node ID, used for ERC20 topics',
    ),
    token_address: z
      .string()
      .optional()
      .describe('token address, used for ERC20 topics'),
    token_symbol: z
      .string()
      .optional()
      .describe('token symbol, used for ERC20 topics'),
    vote_weight_multiplier: PG_INT.optional().describe(
      'vote weight multiplier, used for ERC20 topics',
    ),
  });

  const validationResult = validationSchema.safeParse(body);
  if (validationResult.success === false) {
    throw new AppError(
      `${Errors.ValidationError}: ${validationResult.error.message}`,
    );
  }

  const [topic, analyticsOptions] = await controllers.topics.createTopic({
    // @ts-expect-error StrictNullChecks
    user,
    // @ts-expect-error StrictNullChecks
    community,
    body: validationResult.data,
  });

  controllers.analytics.track(analyticsOptions, req).catch(console.error);

  return success(res, topic);
};
