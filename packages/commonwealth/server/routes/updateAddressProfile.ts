import { AppError } from '../util/errors';
import { success, TypedRequestBody, TypedResponse } from '../types';
import { DB } from '../database';

type UpdateAddressProfileReq = {
  address: string;
  targetProfileAddress: string;
};

type UpdateAddressProfileResp = {
  message: string;
};

const updateAddressProfile = async (
  models: DB,
  req: TypedRequestBody<UpdateAddressProfileReq>,
  res: TypedResponse<UpdateAddressProfileResp>
) => {
  const { address, targetProfileAddress } = req.body;

  if (!address) throw new AppError('Must supply an address');

  const profileAddress = await models.Address.findOne({
    where: { address: targetProfileAddress },
  });

  const profile = await profileAddress.getProfile();
  if (!profile) throw new AppError('Profile not found');

  const account = await models.Address.findOne({ where: { address } });
  if (!account) throw new AppError('Address not found');

  try {
    account.profile_id = profile.id;
    account.save();
  } catch (e) {
    throw new AppError('Error updating address profile');
  }

  return success(res, { message: 'Updated profile!' });
};

export default updateAddressProfile;
