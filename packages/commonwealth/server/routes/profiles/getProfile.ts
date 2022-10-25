import { AppError, ServerError } from '../../util/errors';
import validateChain from '../../util/validateChain';
import { TypedRequestQuery, TypedResponse, success } from '../../types';
import { DB } from '../../models';
import { ProfileAttributes } from '../../models/profile';

type GetProfileReq = {
  address?: string;
  profile_id?: number;
};

export const Errors = {
  NoArgs: "Must provide address or profile_id",
  BothArgs: "Must not provide both args"
};

type GetProfileResp = ProfileAttributes[];

const getProfile = async (
  models: DB,
  req: TypedRequestQuery<GetProfileReq>,
  res: TypedResponse<GetProfileResp>,
) => {
  // This route is for getting a single profile + owned addresses
  // queriable by profile_id or owned address
  const { address, profile_id} = req.query;
  if (!address && !profile_id) throw new AppError(Errors.NoArgs);
  if (address && profile_id) throw new AppError(Errors.BothArgs);

  let profile;
  if (profile_id) {
    profile = await models.Profile.findOne({
      where: { id: profile_id },
      include: [{ model: models.Address, required: true }],
    });
  } else {
    const addressProvided = await models.Address.findOne({
      where: { address },
    })
    profile = await models.Profile.findOne({
      where: { id: addressProvided.profile_id},
      include: [{ model: models.Address, required: true }],
    });
  }

  return success(res, [profile]);
};

export default getProfile;
