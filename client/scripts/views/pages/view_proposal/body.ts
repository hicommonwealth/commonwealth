import 'pages/view_proposal/body.scss';

import m from 'mithril';
import moment from 'moment';
import lity from 'lity';

import { updateRoute } from 'app';
import app from 'state';
import {
  OffchainThread,
  OffchainThreadKind,
  OffchainComment,
  Proposal,
  AnyProposal,
  Account,
  Profile,
  ChainBase,
  OffchainTag
} from 'models';
import { CommentParent } from 'controllers/server/comments';

import { jumpHighlightComment } from 'views/pages/view_proposal/jump_to_comment';
import User from 'views/components/widgets/user';
import QuillEditor from 'views/components/quill_editor';
import QuillFormattedText from 'views/components/quill_formatted_text';
import MarkdownFormattedText from 'views/components/markdown_formatted_text';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import VersionHistoryModal from 'views/modals/version_history_modal';

export enum GlobalStatus {
  Get = 'get',
  Set = 'set'
}

const activeQuillEditorHasText = () => {
  // TODO: Better lookup than document.getElementsByClassName[0]
  // TODO: This should also check whether the Quill editor has changed, rather than whether it has text
  // However, threading is overdue for a refactor anyway, so we'll handle this then
  return (document.getElementsByClassName('ql-editor')[0] as HTMLTextAreaElement)?.innerText.length > 1;
};

export const ProposalBodyAuthor: m.Component<{ comment: OffchainComment<any> }> = {
  view: (vnode) => {
    const { comment } = vnode.attrs;
    if (!comment) return;
    if (!comment.author) return;

    const author : Account<any> = app.community
      ? app.community.accounts.get(comment.author, comment.authorChain)
      : app.chain.accounts.get(comment.author);

    return m('.ProposalBodyAuthor', [
      m(User, {
        user: author,
        tooltip: true,
        linkify: true,
      }),
    ]);
  }
};

export const ProposalBodyCreated: m.Component<{ item: OffchainThread | OffchainComment<any>, link: string }> = {
  view: (vnode) => {
    const { item, link } = vnode.attrs;
    if (!item) return;
    if (!item.createdAt) return;
    const isThread = item instanceof OffchainThread;

    return m('.ProposalBodyCreated', [
      m('a', {
        href: isThread ? `${link}?comment=body` : link,
        onclick: (e) => {
          e.preventDefault();
          updateRoute(isThread ? `${link}?comment=body` : link);
          jumpHighlightComment((isThread ? 'body' : item.id), false, 500);
        }
      }, item.createdAt.fromNow())
    ]);
  }
};

export const ProposalBodyLastEdited: m.Component<{ item: OffchainThread | OffchainComment<any> }> = {
  view: (vnode) => {
    const { item } = vnode.attrs;
    if (!item) return;
    if (item.versionHistory.length === 0) return;
    const isThread = item instanceof OffchainThread;
    const lastEdit = item.versionHistory?.length > 1 ? JSON.parse(item.versionHistory[0]) : null;
    if (!lastEdit) return;

    return m('.ProposalBodyLastEdited', [
      m('a', {
        href: '#',
        onclick: (e) => {
          e.preventDefault();
          app.modals.create({
            modal: VersionHistoryModal,
            data: isThread ? { proposal: item } : { comment: item }
          });
        }
      }, [
        'Edited ',
        moment(lastEdit.timestamp).fromNow()
      ])
    ]);
  }
};

export const ProposalBodyReply: m.Component<{ item: OffchainComment<any>, getSetGlobalReplyStatus, parentType? }> = {
  view: (vnode) => {
    const { item, parentType, getSetGlobalReplyStatus } = vnode.attrs;
    if (!item) return;

    return m('.ProposalBodyReply', [
      m('a', {
        class: 'reply',
        href: '#',
        onclick: async (e) => {
          e.preventDefault();
          if (getSetGlobalReplyStatus(GlobalStatus.Get) && activeQuillEditorHasText()) {
            const confirmed = await confirmationModalWithText('Unsubmitted replies will be lost. Continue?')();
            if (!confirmed) return;
          }
          getSetGlobalReplyStatus(GlobalStatus.Set, item.id);
        },
      }, 'Reply'),
    ]);
  }
};

export const ProposalBodyEdit: m.Component<{ item: OffchainThread | OffchainComment<any>, getSetGlobalReplyStatus, getSetGlobalEditingStatus, parentState }> = {
  view: (vnode) => {
    const { item, getSetGlobalEditingStatus, getSetGlobalReplyStatus, parentState } = vnode.attrs;
    if (!item) return;
    if (item instanceof OffchainThread && item.readOnly) return;
    const isThread = item instanceof OffchainThread;

    return m('.ProposalBodyEdit', [
      m('a', {
        class: isThread ? 'edit-proposal' : 'edit-comment',
        href: '#',
        onclick: async (e) => {
          e.preventDefault();
          if (getSetGlobalReplyStatus(GlobalStatus.Get)) {
            if (activeQuillEditorHasText()) {
              const confirmed = await confirmationModalWithText('Unsubmitted replies will be lost. Continue?')();
              if (!confirmed) return;
            }
            getSetGlobalReplyStatus(GlobalStatus.Set, false, true);
          }
          parentState.editing = true;
          getSetGlobalEditingStatus(GlobalStatus.Set, true);
        },
      }, 'Edit'),
    ]);
  }
};

export const ProposalBodyDelete: m.Component<{ item: OffchainThread | OffchainComment<any> }> = {
  view: (vnode) => {
    const { item } = vnode.attrs;
    if (!item) return;
    const isThread = item instanceof OffchainThread;

    return m('.ProposalBodyDelete', [
      m('a', {
        href: '#',
        onclick: async (e) => {
          e.preventDefault();
          const confirmed = await confirmationModalWithText(
            isThread ? 'Delete this entire thread?' : 'Delete this comment?')();
          if (!confirmed) return;
          (isThread ? app.threads : app.comments).delete(item).then(() => {
            if (isThread) m.route.set(`/${app.activeId()}/`);
            // TODO: set notification bar for 'thread deleted/comment deleted'
          });
        },
      }, 'Delete'),
    ]);
  }
};

export const ProposalBodyCancelEdit: m.Component<{ getSetGlobalEditingStatus, parentState }> = {
  view: (vnode) => {
    const { getSetGlobalEditingStatus, parentState } = vnode.attrs;

    return m('.ProposalBodyCancelEdit', [
      m('a', {
        class: 'cancel-editing',
        href: '#',
        onclick: async (e) => {
          e.preventDefault();
          // TODO: Only show confirmation modal if edits have been made
          const confirmed = await confirmationModalWithText('Cancel editing? Changes will not be saved.')();
          if (!confirmed) return;
          parentState.editing = false;
          getSetGlobalEditingStatus(GlobalStatus.Set, false);
          m.redraw();
        }
      }, 'Cancel')
    ]);
  }
};

export const ProposalBodySaveEdit: m.Component<{
  item: OffchainThread | OffchainComment<any>, getSetGlobalEditingStatus, parentState
}> = {
  view: (vnode) => {
    const { item, getSetGlobalEditingStatus, parentState } = vnode.attrs;
    if (!item) return;
    const isThread = item instanceof OffchainThread;

    return m('.ProposalBodySaveEdit', [
      m('a', {
        href: '#',
        onclick: (e) => {
          e.preventDefault();
          const itemText = parentState.quillEditorState.markdownMode
            ? parentState.quillEditorState.editor.getText()
            : JSON.stringify(parentState.quillEditorState.editor.getContents());
          if (item instanceof OffchainThread) {
            app.threads.edit(item, itemText).then(() => {
              m.route.set(`/${app.activeId()}/proposal/${item.slug}/${item.id}`);
              parentState.editing = false;
              getSetGlobalEditingStatus(GlobalStatus.Set, false);
              m.redraw();
              // TODO: set notification bar for 'thread edited' (?)
            });
          } else if (item instanceof OffchainComment) {
            app.comments.edit(item, itemText).then(() => {
              parentState.editing = false;
              getSetGlobalEditingStatus(GlobalStatus.Set, false);
              m.redraw();
              // TODO: set notification bar for 'comment edited' (?)
            });
          }
        }
      }, 'Save'),
    ]);
  }
};

export const ProposalBodySpacer: m.Component<{}> = {
  view: (vnode) => {
    return m('.ProposalBodySpacer', m.trust('&middot;'));
  }
};

export const ProposalBodyText: m.Component<{ item: AnyProposal | OffchainThread | OffchainComment<any> }> = {
  view: (vnode) => {
    const { item } = vnode.attrs;
    if (!item) return;

    const isThread = item instanceof OffchainThread;
    const body = item instanceof OffchainComment
      ? item.text
      : (item instanceof OffchainThread
        ? item.body
        : item.description);
    if (!body) return;

    return m('.ProposalBodyText', (() => {
      try {
        const doc = JSON.parse(body);
        if (!doc.ops) throw new Error();
        return m(QuillFormattedText, { doc });
      } catch (e) {
        return m(MarkdownFormattedText, { doc: body });
      }
    })());
  }
};

export const ProposalBodyAttachments: m.Component<{ item: OffchainThread | OffchainComment<any> }> = {
  view: (vnode) => {
    const { item } = vnode.attrs;
    if (!item) return;

    return m('.ProposalBodyAttachments', [
      m('p', `Attachments (${item.attachments.length})`),
      item.attachments.map((attachment) => m('a.attachment-item', {
        href: attachment.url,
        title: attachment.description,
        target: '_blank',
        noopener: 'noopener',
        noreferrer: 'noreferrer',
        onclick: (e) => {
          e.preventDefault();
          lity(attachment.url);
        }
      }, [
        m('img', {
          src: attachment.url
        }),
      ]))
    ]);
  }
};

export const ProposalBodyEditor: m.Component<{ item: OffchainThread | OffchainComment<any>, parentState }> = {
  view: (vnode) => {
    const { item, parentState } = vnode.attrs;
    if (!item) return;
    const isThread = item instanceof OffchainThread;
    const body = item instanceof OffchainComment
      ? item.text
      : (item instanceof OffchainThread
        ? item.body
        : null);
    if (!body) return;

    return m('.ProposalBodyEditor', [
      m(QuillEditor, {
        contentsDoc: (() => {
          try {
            const doc = JSON.parse(body);
            if (!doc.ops) throw new Error();
            return doc;
          } catch (e) {
            return body;
          }
        })(),
        oncreateBind: (state) => {
          parentState.quillEditorState = state;
        },
        tabindex: 1,
        theme: 'snow',
        editorNamespace: document.location.pathname
          + (isThread ? `-editing-comment-${item.id}` : '-editing-thread'),
      })
    ]);
  }
};
