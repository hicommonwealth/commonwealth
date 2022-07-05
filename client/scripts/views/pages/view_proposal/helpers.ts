import m from 'mithril';
import moment from 'moment';

import app from 'state';
import { OffchainPoll } from 'models';
import { alertModalWithText } from '../../modals/alert_modal';
import { confirmationModalWithText } from '../../modals/confirm_modal';

export const handleProposalPollVote = async (
  poll: OffchainPoll,
  option: string,
  isSelected: boolean
) => {
  const { activeAccount } = app.user;

  if (!app.isLoggedIn() || !activeAccount || isSelected) return;

  const userInfo = [activeAccount.chain.id, activeAccount.address] as const;

  let confirmationText;

  if (poll.getUserVote(...userInfo)) {
    confirmationText = `Change your vote to '${option}'?`;
  } else {
    confirmationText = `Submit a vote for '${option}'?`;
  }

  const confirmed = await confirmationModalWithText(confirmationText)();

  if (!confirmed) return;
  // submit vote
  poll
    .submitOffchainVote(...userInfo, option)
    .then(() => m.redraw())
    .catch(async () => {
      await alertModalWithText(
        'Error submitting vote. Maybe the poll has already ended?'
      )();
    });
};

export const getProposalPollTimestamp = (
  poll: OffchainPoll,
  pollingEnded: boolean
) => {
  return pollingEnded
    ? `Ended ${poll.endsAt?.format('lll')}`
    : `Ends ${moment().from(poll.endsAt).replace(' ago', '')} left`;
};
