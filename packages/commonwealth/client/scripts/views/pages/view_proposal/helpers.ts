import m from 'mithril';
import $ from 'jquery';
import moment from 'moment';
import app from 'state';
import { Comment, Poll, Thread } from 'models';
import { alertModalWithText } from '../../modals/alert_modal';
import { confirmationModalWithText } from '../../modals/confirm_modal';
import {
  countLinesQuill,
  countLinesMarkdown,
} from '../../components/quill/helpers';
import {
  QUILL_PROPOSAL_LINES_CUTOFF_LENGTH,
  MARKDOWN_PROPOSAL_LINES_CUTOFF_LENGTH,
} from './constants';

// highlight the header/body of a parent thread, or the body of a comment
export const jumpHighlightComment = (commentId: number) => {
  // const $div =
  // commentId === 'parent' || commentId === 'body'
  //   ? $('html, body').find('.ProposalHeader')
  //   : $('html, body').find(`.comment-${commentId}`);

  const $div = $('html, body').find(`.comment-${commentId}`);

  if ($div.length > 0) {
    const divTop = $div.position().top;

    // clear any previous animation
    $div.removeClass('highlighted highlightAnimationComplete');

    $('html, body').animate({ scrollTop: divTop }, 500);
    $div.addClass('highlighted');
    setTimeout(() => {
      $div.addClass('highlightAnimationComplete');
    }, 2000 + 500);
  }
};

export const scrollToForm = (parentId?: number) => {
  setTimeout(() => {
    const $reply = parentId
      ? $(`.comment-${parentId}`).nextAll('.CreateComment')
      : $('.ProposalComments > .CreateComment');

    // if the reply is at least partly offscreen, scroll it entirely into view
    const scrollTop = $('html, body').scrollTop();
    const replyTop = $reply.offset()?.top;
    if (scrollTop + $(window).height() < replyTop + $reply.outerHeight())
      $('html, body').animate(
        {
          scrollTop: replyTop + $reply.outerHeight() - $(window).height() + 40,
        },
        500
      );

    // highlight the reply form
    const animationDelayTime = 2000;
    $reply.addClass('highlighted');
    setTimeout(() => {
      $reply.removeClass('highlighted');
    }, animationDelayTime + 500);

    // focus the reply form
    $reply.find('.ql-editor').focus();
  }, 1);
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

export const getProposalPollTimestamp = (poll: Poll, pollingEnded: boolean) => {
  if (!poll.endsAt.isValid()) {
    return 'No end date';
  }
  return pollingEnded
    ? `Ended ${poll.endsAt?.format('lll')}`
    : `${moment().from(poll.endsAt).replace(' ago', '')} left`;
};

export const clearEditingLocalStorage = (item, isThread: boolean) => {
  if (isThread) {
    localStorage.removeItem(
      `${app.activeChainId()}-edit-thread-${item.id}-storedText`
    );
  } else {
    localStorage.removeItem(
      `${app.activeChainId()}-edit-comment-${item.id}-storedText`
    );
  }
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

export const formatBody = (vnode, updateCollapse) => {
  const { item } = vnode.attrs;
  if (!item) return;

  const body =
    item instanceof Comment
      ? item.text
      : item instanceof Thread
      ? item.body
      : item.description;
  if (!body) return;

  vnode.state.body = body;
  if (updateCollapse) {
    try {
      const doc = JSON.parse(body);
      if (countLinesQuill(doc.ops) > QUILL_PROPOSAL_LINES_CUTOFF_LENGTH) {
        vnode.state.collapsed = true;
      }
    } catch (e) {
      if (countLinesMarkdown(body) > MARKDOWN_PROPOSAL_LINES_CUTOFF_LENGTH) {
        vnode.state.collapsed = true;
      }
    }
  }
};
