import { TypedRequestQuery, TypedResponse, success } from '../../types';
import { DB } from '../../models';
import { ProfileAttributes } from '../../models/profile';

type GetProfilesReq = {
  community_id: string;

  // TODO: goes in pagination helper
  limit?: number;
  page?: string;
  sort?: string;
  profiles_only?: boolean; // no addresses fetched
};

type GetProfilesResp = ProfileAttributes[];

const getProfiles = async (
  models: DB,
  req: TypedRequestQuery<GetProfilesReq>,
  res: TypedResponse<GetProfilesResp>,
) => {
  // This route is for fetching all profiles + addresses by community
  return success(res, []);
};

export default getProfiles;
