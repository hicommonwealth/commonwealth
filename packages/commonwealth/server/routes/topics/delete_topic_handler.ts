import { AppError } from '../../../../common-common/src/errors';
import { TopicAttributes } from '../../models/topic';
import { ServerControllers } from '../../routing/router';
import { TypedRequest, TypedResponse, success } from '../../types';
import z from 'zod';

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
  res: TypedResponse<DeleteTopicResponse>
) => {
  const { user, chain } = req;
  const { topicId } = req.params;

  const validationSchema = z.coerce.number();
  const validationResult = validationSchema.safeParse(topicId);
  if (validationResult.success === false) {
    throw new AppError(
      `${Errors.ValidationError}: ${validationResult.error.message}`
    );
  }

  await controllers.topics.deleteTopic({
    user,
    chain,
    topicId: validationResult.data,
  });

  return success(res, null);
};
