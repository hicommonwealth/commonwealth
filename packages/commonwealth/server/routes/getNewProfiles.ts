import type { GetNewProfilesResp } from 'common-common/src/api/extApiTypes';
import { validationResult } from 'express-validator';
import type { Request } from 'express';
import type { TypedResponse } from '../types';
import { success, failure } from '../types';
import type { DB } from '../models';

const getNewProfiles = async (
  models: DB,
  req: Request,
  res: TypedResponse<GetNewProfilesResp>
) => {
  const errors = validationResult(req).array();
  if (errors.length !== 0) {
    return failure(res.status(400), errors);
  }

  const profiles = await req.user.getProfiles();
  const addresses = await req.user.getAddresses();

  return success(res, { profiles, addresses });
};

export default getNewProfiles;
