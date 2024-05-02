import { AddressInstance } from '@hicommonwealth/model';
import moment from 'moment';

export function addVersionHistory(
  oldVersionHistory: string[],
  body: string,
  address: AddressInstance,
  isDelta = false,
): { latestVersion: string; versionHistory: string[] } {
  // update version history
  let latestVersion;
  try {
    latestVersion = JSON.parse(oldVersionHistory[0]).body;
  } catch (err) {
    console.log(err);
  }
  const parsedBody = isDelta
    ? JSON.parse(decodeURIComponent(body)).ops[0].insert
    : body;
  if (parsedBody !== latestVersion) {
    const recentEdit = {
      timestamp: moment(),
      author: address,
      body: parsedBody,
    };
    const versionHistory: string = JSON.stringify(recentEdit);
    const arr = oldVersionHistory;
    arr.unshift(versionHistory);
    return { latestVersion, versionHistory: arr };
  }

  return { latestVersion, versionHistory: null };
}
