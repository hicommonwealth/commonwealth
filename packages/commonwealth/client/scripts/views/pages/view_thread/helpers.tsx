import type { Poll } from 'models';
import moment from 'moment';

import app from 'state';
import { notifyError } from 'controllers/app/notifications';
import { openConfirmation } from 'views/modals/confirmation_modal';
import React from 'react';

export const handlePollVote = async (
  poll: Poll,
  option: string,
  isSelected: boolean,
  callback: () => any
) => {
  const { activeAccount } = app.user;

  if (!app.isLoggedIn() || !activeAccount || isSelected) return;

  const userInfo = [activeAccount.chain.id, activeAccount.address] as const;

  const confirmationText = poll.getUserVote(...userInfo)
    ? `Change your vote to '${option}'?`
    : `Submit a vote for '${option}'?`;

  openConfirmation({
    title: 'Info',
    description: <>{confirmationText}</>,
    buttons: [
      {
        label: 'Submit',
        buttonType: 'mini-black',
        onClick: () => {
          poll
            .submitVote(...userInfo, option)
            .then(() => {
              callback();
            })
            .catch(() => {
              notifyError(
                'Error submitting vote. Maybe the poll has already ended?'
              );
            });
        },
      },
      {
        label: 'Cancel',
        buttonType: 'mini-white',
      },
    ],
  });
};

export const getPollTimestamp = (poll: Poll, pollingEnded: boolean) => {
  if (!poll.endsAt.isValid()) {
    return 'No end date';
  }
  return pollingEnded
    ? `Ended ${poll.endsAt?.format('lll')}`
    : `${moment().from(poll.endsAt).replace(' ago', '')} left`;
};
