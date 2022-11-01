import app from 'state';
import { ContentType } from 'types';
import { Comment, Thread } from 'models';
import {
  countLinesQuill,
  countLinesMarkdown,
} from '../../components/quill/helpers';
import {
  QUILL_PROPOSAL_LINES_CUTOFF_LENGTH,
  MARKDOWN_PROPOSAL_LINES_CUTOFF_LENGTH,
} from './constants';

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
