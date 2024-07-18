import moment from 'moment';
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
