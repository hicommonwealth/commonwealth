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

  const targetProfileAccount = await models.Address.findOne({
    where: { address: targetProfileAddress },
  });

  const targetProfile = await targetProfileAccount.getProfile();
  if (!targetProfile) throw new AppError('Profile not found');

  const currentAccount = await models.Address.findOne({ where: { address } });
  if (!currentAccount) throw new AppError('Address not found');

  const currentProfile = await currentAccount.getProfile();

  try {
    currentAccount.profile_id = targetProfile.id;
    currentAccount.user_id = targetProfile.user_id;
    currentAccount.save();
  } catch (e) {
    throw new AppError('Error updating address profile');
  }

  // Check for targetProfile address saved with currentProfile (quirk of new login flow)
  // const targetProfileAddressWithCurrentProfile = await models.Address.findOne({
  //   where: { address: targetProfileAddress, profile_id: originalProfileId },
  // });
  // if (targetProfileAddressWithCurrentProfile) {
  //   targetProfileAddressWithCurrentProfile.profile_id = targetProfile.id;
  //   targetProfileAddressWithCurrentProfile.save();
  // }

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
