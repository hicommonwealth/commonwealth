import { AppError, ServerError } from '../../util/errors';
import validateChain from '../../util/validateChain';
import { TypedRequestQuery, TypedResponse, success } from '../../types';
import { DB } from '../../models';
import { ProfileAttributes } from '../../models/profile';

type GetProfileReq = {
  address?: string;
  profile_id?: number;
};

type GetProfileResp = ProfileAttributes[];

const getProfile = async (
  models: DB,
  req: TypedRequestQuery<GetProfileReq>,
  res: TypedResponse<GetProfileResp>,
) => {
  // This route is for getting a single profile + owned addresses
  // queriable by profile_id or owned address
  return success(res, []);
};

export default getProfile;
