import { buildFarcasterContestFrameUrl } from '@hicommonwealth/shared';
import { notifyError } from 'client/scripts/controllers/app/notifications';
import moment from 'moment';
import { saveToClipboard } from 'utils/clipboard';
import { Contest } from './ContestsList';

// checks if contest has ended or if it is cancelled
export const isContestActive = ({ contest }: { contest: Contest }) => {
  // first item is the most recent contest
  const { end_time } = contest?.contests?.[0] || {};
  const hasEnded = moment(end_time) < moment();
  return contest?.cancelled ? false : !hasEnded;
};

export const CONTEST_FAQ_URL =
  'https://docs.common.xyz/commonwealth/for-admins-and-mods/enabling-and-running-contests';

export const copyFarcasterContestFrameUrl = async (contestAddress: string) => {
  // FARCASTER_NGROK_DOMAIN should only be setup on local development
  const origin = process.env.FARCASTER_NGROK_DOMAIN || window.location.origin;
  const farcasterUrl = buildFarcasterContestFrameUrl(contestAddress);

  try {
    const fullUrl = new URL(farcasterUrl, origin);
    await saveToClipboard(fullUrl.toString(), true);
  } catch (err) {
    notifyError('Failed to copy to clipboard');
    console.error(err);
  }
};
