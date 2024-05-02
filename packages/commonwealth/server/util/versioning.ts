import moment from 'moment';

export function addVersionHistory(
  oldVersionHistory: string[],
  body: string,
  address,
  delta = false,
): { latestVersion: string; versionHistory: string[] } {
  // update version history
  let latestVersion;
  try {
    latestVersion = JSON.parse(
      oldVersionHistory[oldVersionHistory.length - 1],
    ).body;
  } catch (err) {
    console.log(err);
  }
  const parsedBody = delta
    ? JSON.parse(decodeURIComponent(body)).ops[0].insert
    : body;
  if (parsedBody !== latestVersion) {
    const recentEdit: any = {
      timestamp: moment(),
      author: address,
      body: parsedBody,
    };
    const versionHistory: string = JSON.stringify(recentEdit);
    const arr = oldVersionHistory;
    arr.unshift(versionHistory);
    return { latestVersion, versionHistory: arr };
  }
}
