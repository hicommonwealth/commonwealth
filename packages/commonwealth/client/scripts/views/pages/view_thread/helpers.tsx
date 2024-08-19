import moment from 'moment';
import type Poll from '../../../models/Poll';

import { notifyError } from 'controllers/app/notifications';
import React from 'react';
import { userStore } from 'state/ui/user';
import { openConfirmation } from 'views/modals/confirmation_modal';

export const handlePollVote = async (
  poll: Poll,
  option: string,
  isSelected: boolean,
  callback: () => any,
) => {
  const user = userStore.getState();

  if (!user.isLoggedIn || !user.activeAccount || isSelected) {
    return;
  }

  const userInfo = [
    user.activeAccount?.community?.id || '',
    user.activeAccount?.address || '',
  ] as const;

  const confirmationText = poll.getUserVote(...userInfo)
    ? `Change your vote to '${option}'?`
    : `Submit a vote for '${option}'?`;

  openConfirmation({
    title: 'Info',
    description: <>{confirmationText}</>,
    buttons: [
      {
        label: 'Submit',
        buttonType: 'primary',
        buttonHeight: 'sm',
        onClick: () => {
          poll
            .submitVote(...userInfo, option)
            .then(() => {
              callback();
            })
            .catch(() => {
              notifyError(
                'Error submitting vote. Maybe the poll has already ended?',
              );
            });
        },
      },
      {
        label: 'Cancel',
        buttonType: 'secondary',
        buttonHeight: 'sm',
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
