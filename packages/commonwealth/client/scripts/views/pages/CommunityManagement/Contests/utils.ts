import { TopicWeightedVoting } from '@hicommonwealth/schemas';
import { buildFarcasterContestFrameUrl } from '@hicommonwealth/shared';
import { OpenFeature } from '@openfeature/web-sdk';
import { notifyError } from 'client/scripts/controllers/app/notifications';
import { isContestActive } from 'features/contests/utils/contestUtils';
import { saveToClipboard } from 'shared/utils/clipboard';
import { fetchCachedPublicEnvVar } from 'state/api/configuration/fetchPublicEnvVar';

const client = OpenFeature.getClient();

export const CONTEST_FAQ_URL =
  'https://docs.common.xyz/commonwealth/for-admins-and-mods/enabling-and-running-contests';

export const copyFarcasterContestFrameUrl = async (contestAddress: string) => {
  const configurationData = fetchCachedPublicEnvVar();

  // FARCASTER_NGROK_DOMAIN should only be setup on local development
  const origin =
    configurationData!.FARCASTER_NGROK_DOMAIN || window.location.origin;
  const farcasterUrl = buildFarcasterContestFrameUrl(contestAddress);

  try {
    const fullUrl = new URL(farcasterUrl, origin);
    await saveToClipboard(fullUrl.toString(), true);
  } catch (err) {
    notifyError('Failed to copy to clipboard');
    console.error(err);
  }
};

export const isJudgedContest = (
  contestTopic?: {
    weightedVoting?: TopicWeightedVoting | null;
  } | null,
): boolean => {
  const judgeContestEnabled = client.getBooleanValue('judgeContest', false);
  return (
    !!judgeContestEnabled && !!contestTopic && !contestTopic.weightedVoting
  );
};

export { isContestActive };
