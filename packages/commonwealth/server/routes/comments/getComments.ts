import { NextFunction } from 'express';
import { Action } from 'common-common/src/permissions';
import { ServerError } from 'common-common/src/errors';
import { TypedRequestQuery, TypedResponse, success } from '../../types';
import { DB } from '../../models';
import { CommentAttributes } from '../../models/comment';
import { checkReadPermitted } from '../../util/roles';

type GetCommentsReq = {
  community_id: string;
  thread_id?: number;
  addresses?: string[];

  // TODO: goes in pagination helper
  limit?: number;
  page?: string;
  sort?: string;
  count_only?: boolean;
};

type GetThreadsResp = CommentAttributes[];

const getComments = async (
  models: DB,
  req: TypedRequestQuery<GetCommentsReq>,
  res: TypedResponse<GetThreadsResp>,
  next: NextFunction
) => {
  try {
    await checkReadPermitted(
      models,
      req.query.community_id,
      Action.VIEW_COMMENTS,
      req.user?.id,
    );

    return success(res, []);
    } catch (err) {
      return next(new ServerError(err));
    }
};

export default getComments;
