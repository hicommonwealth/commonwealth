import { AppError } from '@hicommonwealth/adapters';
import { TopicAttributes } from '@hicommonwealth/model';
import z from 'zod';
import { ServerControllers } from '../../routing/router';
import { TypedRequest, TypedResponse, success } from '../../types';

const Errors = {
  ValidationError: 'Validation error',
};

type DeleteTopicRequestParams = {
  topicId: string;
};
type DeleteTopicRequestBody = Partial<TopicAttributes>;

type DeleteTopicResponse = void;

export const deleteTopicHandler = async (
  controllers: ServerControllers,
  req: TypedRequest<DeleteTopicRequestBody, any, DeleteTopicRequestParams>,
  res: TypedResponse<DeleteTopicResponse>,
) => {
  const { user, community } = req;
  const { topicId } = req.params;

  const validationSchema = z.coerce.number();
  const validationResult = validationSchema.safeParse(topicId);
  if (validationResult.success === false) {
    throw new AppError(
      `${Errors.ValidationError}: ${validationResult.error.message}`,
    );
  }

  await controllers.topics.deleteTopic({
    user,
    community,
    topicId: validationResult.data,
  });

  return success(res, null);
};
