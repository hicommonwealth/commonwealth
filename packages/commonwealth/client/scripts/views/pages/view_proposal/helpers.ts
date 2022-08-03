import m from 'mithril';
import $ from 'jquery';
import moment from 'moment';
import app from 'state';
import { Poll } from 'models';
import { alertModalWithText } from '../../modals/alert_modal';
import { confirmationModalWithText } from '../../modals/confirm_modal';

// highlight the header/body of a parent thread, or the body of a comment
export const jumpHighlightComment = (
  commentId,
  shouldScroll = true,
  animationDelayTime = 2000
) => {
  const $div =
    commentId === 'parent' || commentId === 'body'
      ? $('html, body').find('.ProposalHeader')
      : $('html, body').find(`.comment-${commentId}`);

  if ($div.length === 0) return; // if the passed comment was invalid, abort

  const divTop = $div.position().top;

  const scrollTime = 500; // time to scroll

  // clear any previous animation
  $div.removeClass('highlighted highlightAnimationComplete');

  // scroll to comment if necessary, set highlight, wait, then fade out the highlight
  if (shouldScroll) {
    $('html, body').animate({ scrollTop: divTop }, scrollTime);
    $div.addClass('highlighted');
    setTimeout(() => {
      $div.addClass('highlightAnimationComplete');
    }, animationDelayTime + scrollTime);
  } else {
    $div.addClass('highlighted');
    setTimeout(() => {
      $div.addClass('highlightAnimationComplete');
    }, animationDelayTime);
  }
};

export const handleProposalPollVote = async (
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

  const confirmed = await confirmationModalWithText(confirmationText)();

  if (!confirmed) return;
  // submit vote
  poll
    .submitVote(...userInfo, option)
    .then(() => {
      callback();
      m.redraw();
    })
    .catch(async () => {
      await alertModalWithText(
        'Error submitting vote. Maybe the poll has already ended?'
      )();
    });
};

export const getProposalPollTimestamp = (
  poll: Poll,
  pollingEnded: boolean
) => {
  if (!poll.endsAt.isValid()) {
    return 'No end date';
  }
  return pollingEnded
    ? `Ended ${poll.endsAt?.format('lll')}`
    : `${moment().from(poll.endsAt).replace(' ago', '')} left`;
};
