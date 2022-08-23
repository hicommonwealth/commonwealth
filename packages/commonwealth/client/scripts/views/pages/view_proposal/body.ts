/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable no-restricted-globals */

import m from 'mithril';
import lity from 'lity';
import _ from 'lodash';

import { navigateToSubpage } from 'app';
import app from 'state';
import { pluralize } from 'helpers';
import { Thread, Comment, AnyProposal, Account, AddressInfo } from 'models';

import User, { AnonymousUser } from 'views/components/widgets/user';
import { QuillEditorComponent } from 'views/components/quill/quill_editor_component';
import { QuillFormattedText } from 'views/components/quill/quill_formatted_text';
import { MarkdownFormattedText } from 'views/components/quill/markdown_formatted_text';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import VersionHistoryModal from 'views/modals/version_history_modal';
import { MenuItem, Button, Popover } from 'construct-ui';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { ChainType } from 'common-common/src/types';
import { validURL } from '../../../../../shared/utils';
import { IProposalPageState } from '.';
import { jumpHighlightComment } from './helpers';
import {
  countLinesMarkdown,
  countLinesQuill,
} from '../../components/quill/helpers';
import { EditCollaboratorsModal } from '../../modals/edit_collaborators_modal';

const QUILL_PROPOSAL_LINES_CUTOFF_LENGTH = 50;
const MARKDOWN_PROPOSAL_LINES_CUTOFF_LENGTH = 70;

export enum GlobalStatus {
  Get = 'get',
  Set = 'set',
}

const clearEditingLocalStorage = (item, isThread: boolean) => {
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

export const ProposalBodyAvatar: m.Component<{
  item: Thread | Comment<any>;
}> = {
  view: (vnode) => {
    const { item } = vnode.attrs;
    if (!item) return;
    if (!item.author) return;

    // Check for accounts on forums that originally signed up on a different base chain,
    // Render them as anonymous as the forum is unable to support them.

    if (
      item.authorChain !== app.chain.id &&
      item.authorChain !== app.chain.base
    ) {
      return m('.ProposalBodyAvatar', [
        m(AnonymousUser, {
          avatarOnly: true,
          avatarSize: 40,
          showAsDeleted: true,
          distinguishingKey: item.author.slice(item.author.length - 3),
        }),
      ]);
    }

    const author: Account = app.chain.accounts.get(item.author);

    return m('.ProposalBodyAvatar', [
      (item as Comment<any>).deleted
        ? m(AnonymousUser, {
            avatarOnly: true,
            avatarSize: 40,
            showAsDeleted: true,
            distinguishingKey: item.author.slice(item.author.length - 3),
          })
        : m(User, {
            user: author,
            popover: true,
            avatarOnly: true,
            avatarSize: 40,
          }),
    ]);
  },
};

export const ProposalBodyAuthor: m.Component<{
  item: AnyProposal | Thread | Comment<any>;
}> = {
  view: (vnode) => {
    const { item } = vnode.attrs;
    if (!item) return;
    if (!item.author) return;

    // Check for accounts on forums that originally signed up on a different base chain,
    // Render them as anonymous as the forum is unable to support them.
    if (
      (item instanceof Comment || item instanceof Comment) &&
      app.chain.meta.type === ChainType.Offchain
    ) {
      if (
        item.authorChain !== app.chain.id &&
        item.authorChain !== app.chain.base
      ) {
        return m('.ProposalBodyAuthor', [
          m(AnonymousUser, {
            hideAvatar: true,
            distinguishingKey: item.author,
          }),
        ]);
      }
    }

    const author: Account =
      item instanceof Thread || item instanceof Comment
        ? app.chain.accounts.get(item.author)
        : item.author;

    return m('.ProposalBodyAuthor', [
      (item as Comment<any>).deleted
        ? m('span', '[deleted]')
        : m(User, {
            user: author,
            popover: true,
            linkify: true,
            hideAvatar: true,
            showAddressWithDisplayName: true,
          }),
      item instanceof Thread &&
        item.collaborators &&
        item.collaborators.length > 0 &&
        m('span.proposal-collaborators', [
          ' and ',
          m(Popover, {
            inline: true,
            interactionType: 'hover',
            transitionDuration: 0,
            hoverOpenDelay: 500,
            closeOnContentClick: true,
            class: 'proposal-collaborators-popover',
            content: item.collaborators.map(({ address, chain }) => {
              return m(User, {
                user: new AddressInfo(null, address, chain, null),
                linkify: true,
              });
            }),
            trigger: m(
              'a.proposal-collaborators',
              { href: '#' },
              pluralize(item.collaborators?.length, 'other')
            ),
          }),
        ]),
    ]);
  },
};

export const ProposalBodyCreated: m.Component<{
  item: AnyProposal | Thread | Comment<any>;
  link: string;
}> = {
  view: (vnode) => {
    const { item, link } = vnode.attrs;
    if (!item) return;
    if (!item.createdAt) return;
    const isThread = item instanceof Thread;

    if (item instanceof Thread || item instanceof Comment) {
      return m('.ProposalBodyCreated', [
        m(
          'a',
          {
            href: isThread ? `${link}?comment=body` : link,
            onclick: (e) => {
              e.preventDefault();
              const target = isThread ? `${link}?comment=body` : link;
              if (target === document.location.href) return;
              history.replaceState(history.state, '', target);
              jumpHighlightComment(isThread ? 'body' : item.id, false, 500);
            },
          },
          item.createdAt.fromNow()
        ),
      ]);
    } else {
      return null;
    }
  },
};

export const ProposalBodyLastEdited: m.Component<{
  item: Thread | Comment<any>;
}> = {
  view: (vnode) => {
    const { item } = vnode.attrs;
    if (!item) return;
    const isThread = item instanceof Thread;
    if (!item.lastEdited) {
      return;
    }

    return m('.ProposalBodyLastEdited', [
      m(
        'a',
        {
          href: '#',
          onclick: async (e) => {
            e.preventDefault();
            let postWithHistory;
            const grabHistory = isThread && !item.versionHistory?.length;
            if (grabHistory) {
              try {
                postWithHistory = await app.threads.fetchThreadsFromId([
                  item.id,
                ]);
              } catch (err) {
                notifyError('Version history not found.');
                return;
              }
            }
            app.modals.create({
              modal: VersionHistoryModal,
              data: {
                item: grabHistory && postWithHistory ? postWithHistory : item,
              },
            });
          },
        },
        ['Edited ', item.lastEdited.fromNow()]
      ),
    ]);
  },
};

export const ProposalBodyEditMenuItem: m.Component<{
  item: Thread | Comment<any>;
  parentState;
  proposalPageState: IProposalPageState;
  getSetGlobalEditingStatus;
}> = {
  view: (vnode) => {
    const { item, getSetGlobalEditingStatus, proposalPageState, parentState } =
      vnode.attrs;
    if (!item) return;
    if (item instanceof Thread && item.readOnly) return;
    const isThread = item instanceof Thread;

    return m(MenuItem, {
      label: 'Edit',
      class: isThread ? 'edit-proposal' : 'edit-comment',
      onclick: async (e) => {
        e.preventDefault();
        parentState.currentText =
          item instanceof Thread ? item.body : item.text;
        if (proposalPageState.replying) {
          if (activeQuillEditorHasText()) {
            const confirmed = await confirmationModalWithText(
              'Unsubmitted replies will be lost. Continue?'
            )();
            if (!confirmed) return;
          }
          proposalPageState.replying = false;
          proposalPageState.parentCommentId = null;
        }
        parentState.editing = true;
        getSetGlobalEditingStatus(GlobalStatus.Set, true);
      },
    });
  },
};

export const ProposalBodyDeleteMenuItem: m.Component<{
  item: Thread | Comment<any>;
  refresh?: Function;
}> = {
  view: (vnode) => {
    const { item, refresh } = vnode.attrs;
    if (!item) return;
    const isThread = item instanceof Thread;

    return m(MenuItem, {
      label: 'Delete',
      onclick: async (e) => {
        e.preventDefault();
        const confirmed = await confirmationModalWithText(
          isThread ? 'Delete this entire thread?' : 'Delete this comment?'
        )();
        if (!confirmed) return;
        (isThread ? app.threads : app.comments).delete(item).then(() => {
          if (isThread) navigateToSubpage('/');
          if (refresh) refresh();
          m.redraw();
          // TODO: set notification bar for 'thread deleted/comment deleted'
        });
      },
    });
  },
};

export const EditCollaboratorsButton: m.Component<{
  proposal: Thread;
}> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;

    return m(MenuItem, {
      label: 'Edit collaborators',
      onclick: async (e) => {
        e.preventDefault();
        app.modals.create({
          modal: EditCollaboratorsModal,
          data: {
            thread: proposal,
          },
        });
      },
    });
  },
};

export const ProposalBodyCancelEdit: m.Component<{
  item;
  getSetGlobalEditingStatus;
  parentState;
}> = {
  view: (vnode) => {
    const { item, getSetGlobalEditingStatus, parentState } = vnode.attrs;

    return m('.ProposalBodyCancelEdit', [
      m(
        Button,
        {
          class: 'cancel-editing',
          label: 'Cancel',
          disabled: parentState.saving,
          intent: 'none',
          rounded: true,
          onclick: async (e) => {
            e.preventDefault();
            let confirmed = true;
            const threadText =
              parentState.quillEditorState.textContentsAsString;
            if (threadText !== parentState.currentText) {
              confirmed = await confirmationModalWithText(
                'Cancel editing? Changes will not be saved.'
              )();
            }
            if (!confirmed) return;
            parentState.editing = false;
            getSetGlobalEditingStatus(GlobalStatus.Set, false);
            clearEditingLocalStorage(item, item instanceof Thread);
            m.redraw();
          },
        },
        'Cancel'
      ),
    ]);
  },
};

export const ProposalBodySaveEdit: m.Component<{
  item: Thread | Comment<any>;
  getSetGlobalEditingStatus;
  parentState;
  callback?: Function; // required for Comments
}> = {
  view: (vnode) => {
    const { item, getSetGlobalEditingStatus, parentState, callback } =
      vnode.attrs;
    if (!item) return;
    const isThread = item instanceof Thread;
    const isComment = item instanceof Comment;

    return m('.ProposalBodySaveEdit', [
      m(
        Button,
        {
          class: 'save-editing',
          label: 'Save',
          disabled: parentState.saving,
          intent: 'primary',
          rounded: true,
          onclick: (e) => {
            e.preventDefault();
            if (parentState.updatedUrl) {
              if (!validURL(parentState.updatedUrl)) {
                notifyError('Must provide a valid URL.');
                return;
              }
            }
            parentState.saving = true;
            parentState.quillEditorState.disable();
            const itemText = parentState.quillEditorState.textContentsAsString;
            if (item instanceof Thread) {
              app.threads
                .edit(
                  item,
                  itemText,
                  parentState.updatedTitle,
                  parentState.updatedUrl
                )
                .then(() => {
                  navigateToSubpage(`/discussion/${item.id}`);
                  parentState.editing = false;
                  parentState.saving = false;
                  clearEditingLocalStorage(item, true);
                  getSetGlobalEditingStatus(GlobalStatus.Set, false);
                  m.redraw();
                  notifySuccess('Thread successfully edited');
                });
            } else if (item instanceof Comment) {
              app.comments.edit(item, itemText).then((c) => {
                parentState.editing = false;
                parentState.saving = false;
                clearEditingLocalStorage(item, false);
                getSetGlobalEditingStatus(GlobalStatus.Set, false);
                callback();
              });
            }
          },
        },
        'Save'
      ),
    ]);
  },
};

export const ProposalBodySpacer: m.Component<{}> = {
  view: (vnode) => {
    return m('.ProposalBodySpacer', m.trust('&middot;'));
  },
};

const formatBody = (vnode, updateCollapse) => {
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

export const ProposalBodyText: m.Component<
  {
    item: AnyProposal | Thread | Comment<any>;
  },
  { collapsed: boolean; body: any }
> = {
  oninit: (vnode) => {
    vnode.state.collapsed = false;
    formatBody(vnode, true);
  },
  onupdate: (vnode) => {
    formatBody(vnode, false);
  },
  view: (vnode) => {
    const { body } = vnode.state;
    if (!body) return;

    const getPlaceholder = () => {
      if (!(vnode.attrs.item instanceof Thread)) return;
      const author: Account = app.chain
        ? app.chain.accounts.get(vnode.attrs.item.author)
        : null;

      return m('.ProposalBodyText.proposal-body-placeholder', [
        author
          ? [
              m(User, {
                user: author,
                hideAvatar: true,
                hideIdentityIcon: true,
              }),
              ' created this thread',
            ]
          : ['Created this thread'],
      ]);
    };

    return m(
      '.ProposalBodyText',
      (() => {
        try {
          const doc = JSON.parse(body);
          if (!doc.ops) throw new Error();
          if (
            doc.ops.length === 1 &&
            doc.ops[0] &&
            typeof doc.ops[0].insert === 'string' &&
            doc.ops[0].insert.trim() === ''
          ) {
            return getPlaceholder();
          }

          return m(QuillFormattedText, {
            doc,
            cutoffLines: QUILL_PROPOSAL_LINES_CUTOFF_LENGTH,
            collapse: false,
            hideFormatting: false,
          });
        } catch (e) {
          if (body?.toString().trim() === '') {
            return getPlaceholder();
          }
          return m(MarkdownFormattedText, {
            doc: body,
            cutoffLines: MARKDOWN_PROPOSAL_LINES_CUTOFF_LENGTH,
          });
        }
      })()
    );
  },
};

export const ProposalBodyAttachments: m.Component<{
  item: Thread | Comment<any>;
}> = {
  view: (vnode) => {
    const { item } = vnode.attrs;
    if (!item) return;

    return m('.ProposalBodyAttachments', [
      m('p', `Attachments (${item.attachments.length})`),
      item.attachments.map((attachment) =>
        m(
          'a.attachment-item',
          {
            href: attachment.url,
            title: attachment.description,
            target: '_blank',
            noopener: 'noopener',
            noreferrer: 'noreferrer',
            onclick: (e) => {
              e.preventDefault();
              lity(attachment.url);
            },
          },
          [
            m('img', {
              src: attachment.url,
            }),
          ]
        )
      ),
    ]);
  },
};

export const ProposalBodyEditor: m.Component<
  {
    item: Thread | Comment<any>;
    parentState;
  },
  {
    restoreEdits: boolean;
    savedEdits: string;
  }
> = {
  oninit: async (vnode) => {
    const { item } = vnode.attrs;
    const isThread = item instanceof Thread;
    vnode.state.savedEdits = isThread
      ? localStorage.getItem(
          `${app.activeChainId()}-edit-thread-${item.id}-storedText`
        )
      : localStorage.getItem(
          `${app.activeChainId()}-edit-comment-${item.id}-storedText`
        );
    if (vnode.state.savedEdits) {
      const modalMsg = 'Previous changes found. Restore edits?';
      vnode.state.restoreEdits = await confirmationModalWithText(
        modalMsg,
        'Yes',
        'No'
      )();
      clearEditingLocalStorage(item, isThread);
      m.redraw();
    }
  },
  view: (vnode) => {
    const { item, parentState } = vnode.attrs;
    const { restoreEdits, savedEdits } = vnode.state;

    if (!item) return;
    const isThread = item instanceof Thread;
    const body =
      restoreEdits && savedEdits
        ? savedEdits
        : item instanceof Comment
        ? (item as Comment<any>).text
        : item instanceof Thread
        ? (item as Thread).body
        : null;

    if (!body) return;
    if (savedEdits && restoreEdits === undefined) {
      return m(QuillEditorComponent);
    }

    return m('.ProposalBodyEditor', [
      m(QuillEditorComponent, {
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
        imageUploader: true,
        tabindex: 1,
        theme: 'snow',
        editorNamespace: isThread
          ? `edit-thread-${item.id}`
          : `edit-comment-${item.id}`,
      }),
    ]);
  },
};
