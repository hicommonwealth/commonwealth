import { AddressInstance } from '@hicommonwealth/model';
import moment from 'moment';

export function addVersionHistory(
  oldVersionHistory: string[],
  body: string,
  address: AddressInstance,
): { latestVersion: string; versionHistory: string[] } {
  // update version history
  let latestVersion;
  try {
    latestVersion = JSON.parse(oldVersionHistory[0]).body;
  } catch (err) {
    console.log(err);
  }

  let parsedBody;
  try {
    parsedBody = JSON.parse(decodeURIComponent(body)).ops[0].insert;
  } catch (error) {
    // If parsing fails, or the property doesn't exist, assign the original body
    parsedBody = body;
  }

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
