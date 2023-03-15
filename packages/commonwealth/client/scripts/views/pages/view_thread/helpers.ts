import { redraw } from 'mithrilInterop';
import type { Poll } from 'models';
import moment from 'moment';

import app from 'state';

export const handlePollVote = async (
  poll: Poll,
  option: string,
  isSelected: boolean,
  callback: () => any
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

  const confirmed = window.confirm(confirmationText);

  if (!confirmed) return;
  // submit vote
  poll
    .submitVote(...userInfo, option)
    .then(() => {
      callback();
    })
    .catch(() => {
      window.confirm(
        'Error submitting vote. Maybe the poll has already ended?'
      );
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

export const activeQuillEditorHasText = () => {
  // TODO: Better lookup than document.getElementsByClassName[0]
  // TODO: This should also check whether the Quill editor has changed, rather than whether it has text
  // However, threading is overdue for a refactor anyway, so we'll handle this then
  return (
    (document.getElementsByClassName('ql-editor')[0] as HTMLTextAreaElement)
      ?.innerText.length > 1
  );
};
