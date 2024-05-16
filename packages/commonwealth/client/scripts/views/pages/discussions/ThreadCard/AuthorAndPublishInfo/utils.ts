import { Moment } from 'moment';
import { UserProfile } from '../../../../../models/MinimumProfile';

export const formatVersionText = (
  timestamp: Moment,
  address: string | null,
  profile: UserProfile,
  collabInfo: Record<string, string>,
) => {
  const formattedTime = timestamp.format('MMMM D, YYYY h:mmA');
  // Some old posts don't have address, so account for them by omitting address
  if (!address) {
    return formattedTime;
  }
  let formattedName = collabInfo[address] ?? 'Anonymous';
  if (profile.address === address) {
    formattedName = profile.name ?? 'Anonymous';
  }

  return formattedTime + '\n' + formattedName + ' ' + address.substring(0, 5);
};
