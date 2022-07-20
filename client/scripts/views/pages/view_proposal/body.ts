/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable no-restricted-globals */
import 'pages/view_proposal/editor_permissions.scss';

import m from 'mithril';
import lity from 'lity';
import $ from 'jquery';
import _ from 'lodash';

import { updateRoute, navigateToSubpage } from 'app';
import app from 'state';
import { pluralize } from 'helpers';
import {
  OffchainThread,
  OffchainComment,
  AnyProposal,
  Account,
  Profile,
  AddressInfo,
} from 'models';

import User, { AnonymousUser } from 'views/components/widgets/user';
import { QuillEditorComponent } from 'views/components/quill/quill_editor_component';
import { QuillFormattedText } from 'views/components/quill/quill_formatted_text';
import { MarkdownFormattedText } from 'views/components/quill/markdown_formatted_text';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import VersionHistoryModal from 'views/modals/version_history_modal';
import {
  MenuItem,
  Button,
  Dialog,
  QueryList,
  Classes,
  ListItem,
  Popover,
} from 'construct-ui';
import {
  notifyError,
  notifyInfo,
  notifySuccess,
} from 'controllers/app/notifications';
import { ChainType } from '../../../../../shared/types';
import { validURL } from '../../../../../shared/utils';
import { IProposalPageState } from '.';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { jumpHighlightComment } from './helpers';

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
  item: OffchainThread | OffchainComment<any>;
}> = {
  view: (vnode) => {
    const { item } = vnode.attrs;
    if (!item) return;
    if (!item.author) return;

    // Check for accounts on offchain forums that originally signed up on a different base chain,
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

    const author: Account<any> = app.chain.accounts.get(item.author);

    return m('.ProposalBodyAvatar', [
      (item as OffchainComment<any>).deleted
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
  item: AnyProposal | OffchainThread | OffchainComment<any>;
}> = {
  view: (vnode) => {
    const { item } = vnode.attrs;
    if (!item) return;
    if (!item.author) return;

    // Check for accounts on offchain forums that originally signed up on a different base chain,
    // Render them as anonymous as the forum is unable to support them.
    if (
      (item instanceof OffchainComment || item instanceof OffchainComment) &&
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

    const author: Account<any> =
      item instanceof OffchainThread || item instanceof OffchainComment
        ? app.chain.accounts.get(item.author)
        : item.author;

    return m('.ProposalBodyAuthor', [
      (item as OffchainComment<any>).deleted
        ? m('span', '[deleted]')
        : m(User, {
            user: author,
            popover: true,
            linkify: true,
            hideAvatar: true,
            showAddressWithDisplayName: true,
          }),
      item instanceof OffchainThread &&
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
  item: AnyProposal | OffchainThread | OffchainComment<any>;
  link: string;
}> = {
  view: (vnode) => {
    const { item, link } = vnode.attrs;
    if (!item) return;
    if (!item.createdAt) return;
    const isThread = item instanceof OffchainThread;

    if (item instanceof OffchainThread || item instanceof OffchainComment) {
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
  item: OffchainThread | OffchainComment<any>;
}> = {
  view: (vnode) => {
    const { item } = vnode.attrs;
    if (!item) return;
    const isThread = item instanceof OffchainThread;
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
  item: OffchainThread | OffchainComment<any>;
  parentState;
  proposalPageState: IProposalPageState;
  getSetGlobalEditingStatus;
}> = {
  view: (vnode) => {
    const { item, getSetGlobalEditingStatus, proposalPageState, parentState } =
      vnode.attrs;
    if (!item) return;
    if (item instanceof OffchainThread && item.readOnly) return;
    const isThread = item instanceof OffchainThread;

    return m(MenuItem, {
      label: 'Edit',
      class: isThread ? 'edit-proposal' : 'edit-comment',
      onclick: async (e) => {
        e.preventDefault();
        parentState.currentText =
          item instanceof OffchainThread ? item.body : item.text;
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
  item: OffchainThread | OffchainComment<any>;
  refresh?: Function;
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
          if (isThread) navigateToSubpage('/');
          if (refresh) refresh();
          m.redraw();
          // TODO: set notification bar for 'thread deleted/comment deleted'
        });
      },
    });
  },
};

export const EditPermissionsButton: m.Component<{
  openEditPermissions: Function;
}> = {
  view: (vnode) => {
    const { openEditPermissions } = vnode.attrs;
    return m(MenuItem, {
      label: 'Edit collaborators',
      onclick: async (e) => {
        e.preventDefault();
        openEditPermissions();
      },
    });
  },
};

export const ProposalEditorPermissions: m.Component<
  {
    thread: OffchainThread;
    popoverMenu: boolean;
    onChangeHandler: any;
    openStateHandler: any;
  },
  {
    membersFetched: boolean;
    items: any[];
    addedEditors: any;
    removedEditors: any;
    isOpen: boolean;
  }
> = {
  view: (vnode) => {
    const { thread } = vnode.attrs;
    // TODO Graham 4/4/21: We should begin developing boilerplate around fetching toggles, state
    if (!vnode.state.membersFetched) {
      vnode.state.membersFetched = true;
      const chainOrCommObj = { chain: app.activeChainId() };
      // TODO Graham 4/4/21: This needs pagination, search, or serializing.
      // The fetch time for large communities is getting unwieldy.
      $.get(`${app.serverUrl()}/bulkMembers`, chainOrCommObj)
        .then((response) => {
          if (response.status !== 'Success')
            throw new Error('Could not fetch members');
          vnode.state.items = response.result.filter((role) => {
            return role.Address.address !== app.user.activeAccount?.address;
          });
          m.redraw();
        })
        .catch((err) => {
          m.redraw();
          console.error(err);
        });
    }
    if (!vnode.state.items?.length) return;
    if (!vnode.state.addedEditors) {
      vnode.state.addedEditors = {};
    }
    if (!vnode.state.removedEditors) {
      vnode.state.removedEditors = {};
    }
    const { items } = vnode.state;
    const allCollaborators = thread.collaborators
      .concat(Object.values(vnode.state.addedEditors))
      .filter(
        (c) => !Object.keys(vnode.state.removedEditors).includes(c.address)
      );
    const existingCollaborators = m('.existing-collaborators', [
      m('span', 'Selected collaborators'),
      m(
        '.collaborator-listing',
        allCollaborators.map((c) => {
          const user: Profile = app.profiles.getProfile(c.chain, c.address);
          return m('.user-wrap', [
            m(User, { user }),
            m(CWIcon, {
              iconName: 'close',
              size: 'small',
              class: 'role-x-icon',
              onclick: async () => {
                // If already scheduled for addition, un-schedule
                if (vnode.state.addedEditors[c.address]) {
                  delete vnode.state.addedEditors[c.address];
                } else {
                  // If already an existing editor, schedule for removal
                  vnode.state.removedEditors[c.address] = c;
                }
              },
            }),
          ]);
        })
      ),
    ]);

    return m(Dialog, {
      basic: false,
      class: 'ProposalEditorPermissions',
      closeOnEscapeKey: true,
      closeOnOutsideClick: true,
      content: m('.proposal-editor-permissions-wrap', [
        m(QueryList, {
          checkmark: true,
          items,
          inputAttrs: {
            placeholder: 'Enter username or address...',
          },
          itemRender: (role: any, idx: number) => {
            const user: Profile = app.profiles.getProfile(
              role.Address.chain,
              role.Address.address
            );
            const recentlyAdded = !$.isEmptyObject(
              vnode.state.addedEditors[role.Address.address]
            );
            return m(ListItem, {
              label: [m(User, { user })],
              selected: recentlyAdded,
              key: role.Address.address,
            });
          },
          itemPredicate: (query, item, idx) => {
            const address = (item as any).Address;
            return address.name
              ? address.name.toLowerCase().includes(query.toLowerCase())
              : address.address.toLowerCase().includes(query.toLowerCase());
          },
          onSelect: (item) => {
            const addrItem = (item as any).Address;
            // If already scheduled for removal, un-schedule
            if (vnode.state.removedEditors[addrItem.address]) {
              delete vnode.state.removedEditors[addrItem.address];
            }
            // If already scheduled for addition, un-schedule
            if (vnode.state.addedEditors[addrItem.address]) {
              delete vnode.state.addedEditors[addrItem.address];
            } else if (
              thread.collaborators.filter((c) => {
                return (
                  c.address === addrItem.address && c.chain === addrItem.chain
                );
              }).length === 0
            ) {
              // If unscheduled for addition, and not an existing editor, schedule
              vnode.state.addedEditors[addrItem.address] = addrItem;
            } else {
              notifyInfo('Already an editor');
            }
          },
        }),
        allCollaborators.length > 0 && existingCollaborators,
      ]),
      hasBackdrop: true,
      isOpen: vnode.attrs.popoverMenu ? true : vnode.state.isOpen,
      inline: false,
      onClose: () => {
        if (vnode.attrs.popoverMenu) {
          vnode.attrs.openStateHandler(false);
          m.redraw();
        } else {
          vnode.state.isOpen = false;
        }
      },
      title: 'Edit collaborators',
      transitionDuration: 200,
      footer: m(`.${Classes.ALIGN_RIGHT}`, [
        m(Button, {
          label: 'Cancel',
          rounded: true,
          onclick: async () => {
            if (vnode.attrs.popoverMenu) {
              vnode.attrs.openStateHandler(false);
              m.redraw();
            } else {
              vnode.state.isOpen = false;
            }
          },
        }),
        m(Button, {
          disabled:
            $.isEmptyObject(vnode.state.addedEditors) &&
            $.isEmptyObject(vnode.state.removedEditors),
          label: 'Save changes',
          intent: 'primary',
          rounded: true,
          onclick: async () => {
            if (!$.isEmptyObject(vnode.state.addedEditors)) {
              try {
                // TODO Graham 4/4/22: Break off into proper controller methods
                const response = await $.post(`${app.serverUrl()}/addEditors`, {
                  address: app.user.activeAccount.address,
                  author_chain: app.user.activeAccount.chain.id,
                  chain: app.activeChainId(),
                  thread_id: thread.id,
                  editors: JSON.stringify(vnode.state.addedEditors),
                  jwt: app.user.jwt,
                });
                const { status, result } = response;
                if (status === 'Success') {
                  thread.collaborators = result.collaborators;
                  notifySuccess('Collaborators added');
                } else {
                  notifyError('Failed to add collaborators');
                }
              } catch (err) {
                throw new Error(
                  err.responseJSON && err.responseJSON.error
                    ? err.responseJSON.error
                    : 'Failed to add collaborators'
                );
              }
            }
            if (!$.isEmptyObject(vnode.state.removedEditors)) {
              try {
                const response = await $.post(
                  `${app.serverUrl()}/deleteEditors`,
                  {
                    address: app.user.activeAccount.address,
                    author_chain: app.user.activeAccount.chain.id,
                    chain: app.activeChainId(),
                    thread_id: thread.id,
                    editors: JSON.stringify(vnode.state.removedEditors),
                    jwt: app.user.jwt,
                  }
                );
                const { status, result } = response;
                if (status === 'Success') {
                  thread.collaborators = result.collaborators;
                  notifySuccess('Collaborators removed');
                } else {
                  throw new Error('Failed to remove collaborators');
                }
                m.redraw();
              } catch (err) {
                const errMsg =
                  err.responseJSON?.error || 'Failed to remove collaborators';
                notifyError(errMsg);
              }
            }
            if (vnode.attrs.popoverMenu) {
              vnode.attrs.openStateHandler(false);
              m.redraw();
            } else {
              vnode.state.isOpen = false;
            }
          },
        }),
      ]),
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
            clearEditingLocalStorage(item, item instanceof OffchainThread);
            m.redraw();
          },
        },
        'Cancel'
      ),
    ]);
  },
};

export const ProposalBodySaveEdit: m.Component<{
  item: OffchainThread | OffchainComment<any>;
  getSetGlobalEditingStatus;
  parentState;
  callback?: Function; // required for OffchainComments
}> = {
  view: (vnode) => {
    const { item, getSetGlobalEditingStatus, parentState, callback } =
      vnode.attrs;
    if (!item) return;
    const isThread = item instanceof OffchainThread;
    const isComment = item instanceof OffchainComment;

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
            const { quillEditorState } = parentState;
            quillEditorState.disable();
            const itemText = quillEditorState.textContentsAsString;
            if (item instanceof OffchainThread) {
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
            } else if (item instanceof OffchainComment) {
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

const countLinesMarkdown = (text) => {
  return text.split('\n').length - 1;
};

const formatBody = (vnode) => {
  const { item } = vnode.attrs;
  if (!item) return;

  const body =
    item instanceof OffchainComment
      ? item.text
      : item instanceof OffchainThread
      ? item.body
      : item.description;
  if (!body) return;

  vnode.state.body = body;
};

export const ProposalBodyText: m.Component<
  {
    item: AnyProposal | OffchainThread | OffchainComment<any>;
  },
  { collapsed: boolean; body: any }
> = {
  oninit: (vnode) => {
    vnode.state.collapsed = false;
    formatBody(vnode);
  },
  onupdate: (vnode) => {
    formatBody(vnode);
  },
  view: (vnode) => {
    const { body } = vnode.state;
    if (!body) return;

    const getPlaceholder = () => {
      if (!(vnode.attrs.item instanceof OffchainThread)) return;
      const author: Account<any> = app.chain
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
  item: OffchainThread | OffchainComment<any>;
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
    item: OffchainThread | OffchainComment<any>;
    parentState;
  },
  {
    restoreEdits: boolean;
    savedEdits: string;
  }
> = {
  oninit: async (vnode) => {
    const { item } = vnode.attrs;
    const isThread = item instanceof OffchainThread;
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
    const isThread = item instanceof OffchainThread;
    const body =
      restoreEdits && savedEdits
        ? savedEdits
        : item instanceof OffchainComment
        ? (item as OffchainComment<any>).text
        : item instanceof OffchainThread
        ? (item as OffchainThread).body
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
