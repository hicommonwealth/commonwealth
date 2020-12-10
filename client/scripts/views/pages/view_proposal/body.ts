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
} from 'models';
import { CommentParent } from 'controllers/server/comments';

import jumpHighlightComment from 'views/pages/view_proposal/jump_to_comment';
import User from 'views/components/widgets/user';
import QuillEditor from 'views/components/quill_editor';
import QuillFormattedText from 'views/components/quill_formatted_text';
import MarkdownFormattedText from 'views/components/markdown_formatted_text';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import VersionHistoryModal from 'views/modals/version_history_modal';
import ReactionButton, { ReactionType } from 'views/components/reaction_button';
import { MenuItem, Button } from 'construct-ui';
import { notifySuccess } from 'controllers/app/notifications';

export enum GlobalStatus {
  Get = 'get',
  Set = 'set'
}

const clearEditingLocalStorage = (item, isThread: boolean) => {
  if (isThread) {
    localStorage.removeItem(`${app.activeId()}-edit-thread-${item.id}-storedText`);
  } else {
    localStorage.removeItem(`${app.activeId()}-edit-comment-${item.id}-storedText`);
  }
};

export const activeQuillEditorHasText = () => {
  // TODO: Better lookup than document.getElementsByClassName[0]
  // TODO: This should also check whether the Quill editor has changed, rather than whether it has text
  // However, threading is overdue for a refactor anyway, so we'll handle this then
  return (document.getElementsByClassName('ql-editor')[0] as HTMLTextAreaElement)?.innerText.length > 1;
};

export const ProposalBodyAvatar: m.Component<{ item: OffchainThread | OffchainComment<any> }> = {
  view: (vnode) => {
    const { item } = vnode.attrs;
    if (!item) return;
    if (!item.author) return;

    const author : Account<any> = app.community
      ? app.community.accounts.get(item.author, item.authorChain)
      : app.chain.accounts.get(item.author);

    return m('.ProposalBodyAvatar', [
      m(User, {
        user: author,
        popover: true,
        avatarOnly: true,
        avatarSize: 40,
      }),
    ]);
  }
};

export const ProposalBodyAuthor: m.Component<{ item: AnyProposal | OffchainThread | OffchainComment<any> }> = {
  view: (vnode) => {
    const { item } = vnode.attrs;
    if (!item) return;
    if (!item.author) return;

    const author : Account<any> = (item instanceof OffchainThread || item instanceof OffchainComment)
      ? (app.community
        ? app.community.accounts.get(item.author, item.authorChain)
        : app.chain.accounts.get(item.author))
      : item.author;

    return m('.ProposalBodyAuthor', [
      m(User, {
        user: author,
        popover: true,
        linkify: true,
        hideAvatar: true,
      }),
    ]);
  }
};

export const ProposalBodyCreated: m.Component<{
  item: AnyProposal | OffchainThread | OffchainComment<any>, link: string
}> = {
  view: (vnode) => {
    const { item, link } = vnode.attrs;
    if (!item) return;
    if (!item.createdAt) return;
    const isThread = item instanceof OffchainThread;

    if (item instanceof OffchainThread || item instanceof OffchainComment) {
      return m('.ProposalBodyCreated', [
        m('a', {
          href: isThread ? `${link}?comment=body` : link,
          onclick: (e) => {
            e.preventDefault();
            const target = isThread ? `${link}?comment=body` : link;
            if (target === document.location.href) return;
            // use updateRoute instead of m.route.set to avoid resetting scroll point
            updateRoute(target, {}, { replace: true });
            jumpHighlightComment((isThread ? 'body' : item.id), false, 500);
          }
        }, item.createdAt.fromNow())
      ]);
    } else {
      return null;
    }
  }
};

export const ProposalBodyLastEdited: m.Component<{ item: AnyProposal | OffchainThread | OffchainComment<any> }> = {
  view: (vnode) => {
    const { item } = vnode.attrs;
    if (!item) return;

    if (item instanceof OffchainThread || item instanceof OffchainComment) {
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
    } else {
      return null;
    }
  }
};

export const ProposalBodyReplyMenuItem: m.Component<{
  item: OffchainComment<any>, getSetGlobalReplyStatus, parentType?, parentState
}> = {
  view: (vnode) => {
    const { item, parentType, parentState, getSetGlobalReplyStatus } = vnode.attrs;
    if (!item) return;

    return m(MenuItem, {
      label: 'Comment',
      onclick: async (e) => {
        e.preventDefault();
        if (getSetGlobalReplyStatus(GlobalStatus.Get) && activeQuillEditorHasText()) {
          const confirmed = await confirmationModalWithText('Unsent comments will be lost. Continue?')();
          if (!confirmed) return;
        }
        getSetGlobalReplyStatus(GlobalStatus.Set, item.id);
      },
    });
  }
};

export const ProposalBodyEdit: m.Component<{
  item: OffchainThread | OffchainComment<any>, getSetGlobalReplyStatus, getSetGlobalEditingStatus, parentState
}> = {
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
          parentState.currentText = item instanceof OffchainThread ? item.body : item.text;
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

export const ProposalBodyEditMenuItem: m.Component<{
  item: OffchainThread | OffchainComment<any>, getSetGlobalReplyStatus, getSetGlobalEditingStatus, parentState
}> = {
  view: (vnode) => {
    const { item, getSetGlobalEditingStatus, getSetGlobalReplyStatus, parentState } = vnode.attrs;
    if (!item) return;
    if (item instanceof OffchainThread && item.readOnly) return;
    const isThread = item instanceof OffchainThread;

    return m(MenuItem, {
      label: 'Edit',
      class: isThread ? 'edit-proposal' : 'edit-comment',
      onclick: async (e) => {
        e.preventDefault();
        parentState.currentText = item instanceof OffchainThread ? item.body : item.text;
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
    });
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
            isThread ? 'Delete this entire thread?' : 'Delete this comment?'
          )();
          if (!confirmed) return;
          (isThread ? app.threads : app.comments).delete(item).then(() => {
            if (isThread) m.route.set(`/${app.activeId()}/`);
            m.redraw();
            // TODO: set notification bar for 'thread deleted/comment deleted'
          });
        },
      }, 'Delete'),
    ]);
  }
};

export const ProposalBodyDeleteMenuItem: m.Component<{
  item: OffchainThread | OffchainComment<any>,
  refresh?: Function,
}> = {
  view: (vnode) => {
    const { item, refresh } = vnode.attrs;
    if (!item) return;
    const isThread = item instanceof OffchainThread;

    return m(MenuItem, {
      label: 'Delete',
      onclick: async (e) => {
        e.preventDefault();
        const confirmed = await confirmationModalWithText(
          isThread ? 'Delete this entire thread?' : 'Delete this comment?'
        )();
        if (!confirmed) return;
        (isThread ? app.threads : app.comments).delete(item).then(() => {
          if (isThread) m.route.set(`/${app.activeId()}/`);
          if (refresh) refresh();
          m.redraw();
          // TODO: set notification bar for 'thread deleted/comment deleted'
        });
      },
    });
  }
};

export const ProposalBodyCancelEdit: m.Component<{ item, getSetGlobalEditingStatus, parentState }> = {
  view: (vnode) => {
    const { item, getSetGlobalEditingStatus, parentState } = vnode.attrs;

    return m('.ProposalBodyCancelEdit', [
      m(Button, {
        class: 'cancel-editing',
        label: 'Cancel',
        disabled: parentState.saving,
        intent: 'none',
        onclick: async (e) => {
          e.preventDefault();
          let confirmed = true;
          const threadText = parentState.quillEditorState.markdownMode
            ? parentState.quillEditorState.editor.getText()
            : JSON.stringify(parentState.quillEditorState.editor.getContents());
          if (threadText !== parentState.currentText) {
            confirmed = await confirmationModalWithText('Cancel editing? Changes will not be saved.')();
          }
          if (!confirmed) return;
          parentState.editing = false;
          getSetGlobalEditingStatus(GlobalStatus.Set, false);
          clearEditingLocalStorage(item, item instanceof OffchainThread);
          m.redraw();
        }
      }, 'Cancel')
    ]);
  }
};

export const ProposalBodySaveEdit: m.Component<{
  item: OffchainThread | OffchainComment<any>,
  getSetGlobalEditingStatus,
  parentState,
  callback?: Function; // required for OffchainComments
}> = {
  view: (vnode) => {
    const { item, getSetGlobalEditingStatus, parentState, callback } = vnode.attrs;
    if (!item) return;
    const isThread = item instanceof OffchainThread;

    return m('.ProposalBodySaveEdit', [
      m(Button, {
        class: 'save-editing',
        label: 'Save',
        disabled: parentState.saving,
        intent: 'primary',
        onclick: (e) => {
          e.preventDefault();
          parentState.saving = true;
          parentState.quillEditorState.editor.enable(false);
          const itemText = parentState.quillEditorState.markdownMode
            ? parentState.quillEditorState.editor.getText()
            : JSON.stringify(parentState.quillEditorState.editor.getContents());
          parentState.saving = true;
          if (item instanceof OffchainThread) {
            app.threads.edit(item, itemText, parentState.updatedTitle).then(() => {
              m.route.set(`/${app.activeId()}/proposal/${item.slug}/${item.id}`);
              parentState.editing = false;
              parentState.saving = false;
              clearEditingLocalStorage(item, true);
              getSetGlobalEditingStatus(GlobalStatus.Set, false);
              m.redraw();
              notifySuccess('Thread successfully edited');
            });
          } else if (item instanceof OffchainComment) {
            app.comments.edit(item, itemText).then((c) => {
              parentState.editing = false;
              parentState.saving = false;
              clearEditingLocalStorage(item, false);
              getSetGlobalEditingStatus(GlobalStatus.Set, false);
              callback();
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

    const getPlaceholder = () => {
      if (!(item instanceof OffchainThread)) return;
      const author : Account<any> = app.community
        ? app.community.accounts.get(item.author, item.authorChain)
        : app.chain ? app.chain.accounts.get(item.author) : null;

      return m('.ProposalBodyText.proposal-body-placeholder', [
        author ? [
          m(User, { user: author, hideAvatar: true, hideIdentityIcon: true }),
          ' created this thread'
        ] : [
          'Created this thread'
        ]
      ]);
    };

    return m('.ProposalBodyText', (() => {
      try {
        const doc = JSON.parse(body);
        if (!doc.ops) throw new Error();
        if (doc.ops.length === 1 && doc.ops[0] && typeof doc.ops[0].insert === 'string'
            && doc.ops[0].insert.trim() === '') {
          return getPlaceholder();
        }
        return m(QuillFormattedText, { doc });
      } catch (e) {
        if (body.toString().trim() === '') {
          return getPlaceholder();
        }
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

export const ProposalBodyEditor: m.Component<{
  item: OffchainThread | OffchainComment<any>,
  parentState
},  {
  restoreEdits: boolean,
  savedEdits: string
} > = {
  oninit: async (vnode) => {
    const { item } = vnode.attrs;
    const isThread = item instanceof OffchainThread;
    vnode.state.savedEdits = isThread
      ? localStorage.getItem(`${app.activeId()}-edit-thread-${item.id}-storedText`)
      : localStorage.getItem(`${app.activeId()}-edit-comment-${item.id}-storedText`);
    if (vnode.state.savedEdits) {
      const modalMsg = 'Previous changes found. Restore edits?';
      vnode.state.restoreEdits = await confirmationModalWithText(modalMsg, 'Yes', 'No')();
      clearEditingLocalStorage(item, isThread);
      m.redraw();
    }
  },
  view: (vnode) => {
    const { item, parentState } = vnode.attrs;
    const { restoreEdits, savedEdits } = vnode.state;

    if (!item) return;
    const isThread = item instanceof OffchainThread;
    const body = (restoreEdits && savedEdits)
      ? savedEdits
      : item instanceof OffchainComment
        ? (item as OffchainComment<any>).text
        : item instanceof OffchainThread
          ? (item as OffchainThread).body
          : null;

    if (!body) return;
    if (savedEdits && (restoreEdits === undefined)) {
      return m(QuillEditor);
    }

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
        editorNamespace: isThread
          ? `edit-thread-${item.id}`
          : `edit-comment-${item.id}`,
      })
    ]);
  }
};

export const ProposalBodyReaction: m.Component<{ item: OffchainThread | AnyProposal | OffchainComment<any> }> = {
  view: (vnode) => {
    const { item } = vnode.attrs;
    if (!item) return;

    return m('.ProposalBodyReaction', [
      m(ReactionButton, { post: item, type: ReactionType.Like, tooltip: true })
    ]);
  }
};
