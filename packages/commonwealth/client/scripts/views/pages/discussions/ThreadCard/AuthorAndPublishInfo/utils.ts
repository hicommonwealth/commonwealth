import { DEFAULT_NAME } from '@hicommonwealth/shared';
import { Moment } from 'moment';

export const formatVersionText = (
  timestamp: Moment,
  address: string,
  collabInfo: Record<string, string>,
  profileName?: string,
) => {
  const formattedTime = timestamp
    ?.utc?.()
    ?.local?.()
    ?.format?.('Do MMMM, YYYY • h:mm A');

  if (Object.keys(collabInfo).length === 0) {
    return !profileName ? DEFAULT_NAME : formattedTime + '\n' + profileName;
  }

  const formattedName = collabInfo[address] ?? DEFAULT_NAME;

  return formattedTime + '\n' + formattedName + ' ' + address.substring(0, 5);
};
