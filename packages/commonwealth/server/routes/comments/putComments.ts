import Sequelize from 'sequelize';
import { TypedRequestQuery, TypedResponse, success } from '../../types';
import { DB } from '../../models';
import { GetCommentsResp, IPagination, PutCommentsReq, PutCommentsResp } from 'common-common/src/api/extApiTypes';
import { CommentInstance } from 'commonwealth/server/models/comment';

const { Op } = Sequelize;
const putComments = async (
  models: DB,
  req: TypedRequestQuery<PutCommentsReq>,
  res: TypedResponse<PutCommentsResp>,
) => {
  await models.Comment.bulkCreate(req.query.comments);

  return success(res, {});
};

export default putComments;
