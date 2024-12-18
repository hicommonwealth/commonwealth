import { SnapshotProposal } from 'helpers/snapshot_utils';
import moment from 'moment/moment';

export const calculateTimeRemaining = (proposal: SnapshotProposal) => {
  const now = moment();
  const endTime = moment(proposal.end * 1000);
  const duration = moment.duration(endTime.diff(now));
  const days = duration.days();
  const hours = duration.hours();

  return `${days} ${days > 1 ? 'days' : 'day'} ${hours}${
    hours > 1 ? 'hrs' : 'hr'
  } remaining`;
};
