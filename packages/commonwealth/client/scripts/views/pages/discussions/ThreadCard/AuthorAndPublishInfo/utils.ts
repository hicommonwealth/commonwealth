import { DEFAULT_NAME } from '@hicommonwealth/shared';
import { Moment } from 'moment';
import { UserProfile } from '../../../../../models/MinimumProfile';

export const formatVersionText = (
  timestamp: Moment,
  address: string | null,
  profile: UserProfile,
  collabInfo: Record<string, string>,
) => {
  const formattedTime = timestamp
    ?.utc?.()
    ?.local?.()
    ?.format?.('Do MMMM, YYYY • h:mm A');
  // Some old posts don't have address, so account for them by omitting address
  if (!address) {
    return formattedTime;
  }
  let formattedName = collabInfo[address] ?? DEFAULT_NAME;
  if (profile?.address === address) {
    formattedName = profile.name ?? DEFAULT_NAME;
  }

  return formattedTime + '\n' + formattedName + ' ' + address.substring(0, 5);
};
