import { PutCommentsReq, PutCommentsResp } from 'common-common/src/api/extApiTypes';
import { query } from "express-validator";
import { TypedResponse, success, TypedRequest } from '../../types';
import { DB } from '../../models';

export const getCommentsValidation = [
  query('community_id').isString().trim(),
  query('addresses').optional().toArray(),
  query('count_only').optional().isBoolean().toBoolean()
];

const putComments = async (
  models: DB,
  req: TypedRequest<PutCommentsReq>,
  res: TypedResponse<PutCommentsResp>,
) => {
  try {
    await models.Comment.bulkCreate(req.body.comments);
  } catch (e) {
    console.log(e);
  }

  return success(res, {});
};

export default putComments;
