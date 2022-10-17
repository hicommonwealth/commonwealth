import m from 'mithril';
import moment from 'moment';
import app from 'state';
import { ContentType } from 'types';
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
  const commentEle = document.getElementsByClassName(`comment-${commentId}`)[1];

  if (commentEle) {
    // clear any previous animation
    commentEle.classList.remove('highlighted');
    commentEle.classList.remove('highlightAnimationComplete');
    // scroll to comment
    commentEle.scrollIntoView();
    // add new highlight classes
    commentEle.classList.add('highlighted');
    setTimeout(() => {
      commentEle.classList.add('highlightAnimationComplete');
    }, 2000 + 500);
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

export const getProposalPollTimestamp = (poll: Poll, pollingEnded: boolean) => {
  if (!poll.endsAt.isValid()) {
    return 'No end date';
  }
  return pollingEnded
    ? `Ended ${poll.endsAt?.format('lll')}`
    : `${moment().from(poll.endsAt).replace(' ago', '')} left`;
};

export const clearEditingLocalStorage = (
  id: number | string,
  contentType: ContentType
) => {
  localStorage.removeItem(
    `${app.activeChainId()}-edit-${contentType}-${id}-storedText`
  );
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
