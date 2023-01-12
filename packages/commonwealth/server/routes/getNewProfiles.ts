import { GetNewProfilesReq, GetNewProfilesResp } from 'common-common/src/api/extApiTypes';
import { validationResult } from 'express-validator';
import { TypedRequestQuery, TypedResponse, success, failure } from '../types';

const getNewProfiles = async (
  req: TypedRequestQuery<GetNewProfilesReq>,
  res: TypedResponse<GetNewProfilesResp>,
) => {
  const errors = validationResult(req).array();
  if (errors.length !== 0) {
    return failure(res.status(400), errors);
  }

  const profiles = await req.user.getProfiles();

  return success(res, { profiles });
};

export default getNewProfiles;