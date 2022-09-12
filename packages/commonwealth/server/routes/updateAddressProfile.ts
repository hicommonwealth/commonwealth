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

  console.log('profile id of secondary linked', profile.id);

  const account = await models.Address.findOne({ where: { address } });
  if (!account) throw new AppError('Address not found');

  const currentProfile = await account.getProfile();
  console.log('profile id of original signed in: ', currentProfile.id);

  try {
    account.profile_id = profile.id;
    account.save();
  } catch (e) {
    throw new AppError('Error updating address profile');
  }

  // Check for orphan addresses
  // try {
  //   const addresses = await currentProfile.getAddresses();
  //   if (addresses.length === 1) {
  //     console.log('deleting profile');
  //     const user = await currentProfile.getUser();
  //     const userProfiles = await user.getProfiles();
  //     await currentProfile.destroy();
  //     if (userProfiles.length === 1) {
  //       console.log('also deleting user');
  //       await user.destroy();
  //     }
  //   }
  // } catch (e) {
  //   throw new AppError('Error handling orphan status');
  // }

  return success(res, { message: 'Updated profile!' });
};

export default updateAddressProfile;
