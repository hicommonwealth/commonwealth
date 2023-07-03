import {
  TypedRequest,
  TypedRequestBody,
  TypedResponse,
  success,
} from '../../types';
import { AppError } from '../../../../common-common/src/errors';
import type { DB } from '../../models';
import { findAllRoles } from '../../util/roles';

const Errors = {
  MissingTopic: 'Invalid topic ID',
  Failed: 'Unable to save',
  NotAdmin: 'Not an admin',
};

type UpdateTopicReq = {
  topic_id: string;
  channel_id: string;
  chain_id: string;
};
type UpdateThreadResponse = {};

const updateTopic = async (
  models: DB,
  req: TypedRequestBody<UpdateTopicReq>,
  res: TypedResponse<UpdateThreadResponse>
) => {
  const { topic_id, channel_id, chain_id } = req.body;

  const isAdmin = await findAllRoles(models, {}, chain_id, ['admin']);

  if (!isAdmin || !isAdmin.length) throw new AppError(Errors.NotAdmin);

  const topic = await models.Topic.findOne({
    where: {
      id: topic_id,
    },
  });

  if (!topic) throw new AppError(Errors.MissingTopic);

  try {
    topic.channel_id = channel_id;
    await topic.save();
  } catch (e) {
    console.log(e);
    throw new AppError(Errors.Failed);
  }

  return success(res, {});
};

export default updateTopic;
