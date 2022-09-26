/* @jsx m */
/* eslint-disable no-restricted-globals */
/* eslint-disable max-classes-per-file */

import m from 'mithril';
import lity from 'lity';
import { MenuItem, Popover } from 'construct-ui';

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
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { ChainType } from 'common-common/src/types';
import { validURL } from '../../../../../shared/utils';
import {
  activeQuillEditorHasText,
  clearEditingLocalStorage,
  formatBody,
  jumpHighlightComment,
} from './helpers';
import { EditCollaboratorsModal } from '../../modals/edit_collaborators_modal';
import { GlobalStatus, ProposalPageState } from './types';
import { CWButton } from '../../components/component_kit/cw_button';
import {
  QUILL_PROPOSAL_LINES_CUTOFF_LENGTH,
  MARKDOWN_PROPOSAL_LINES_CUTOFF_LENGTH,
} from './constants';
import { CWText } from '../../components/component_kit/cw_text';

export class ProposalBodyAvatar
  implements
    m.ClassComponent<{
      item: Thread | Comment<any>;
    }>
{
  view(vnode) {
    const { item } = vnode.attrs;
    if (!item) return;
    if (!item.author) return;

    // Check for accounts on forums that originally signed up on a different base chain,
    // Render them as anonymous as the forum is unable to support them.

    if (
      item.authorChain !== app.chain.id &&
      item.authorChain !== app.chain.base
    ) {
      return m(AnonymousUser, {
        avatarOnly: true,
        avatarSize: 40,
        showAsDeleted: true,
        distinguishingKey: item.author.slice(item.author.length - 3),
      });
    }

    const author: Account = app.chain.accounts.get(item.author);

    return (item as Comment<any>).deleted
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
        });
  }
}

export class ProposalBodyAuthor
  implements
    m.Component<{
      item: AnyProposal | Thread | Comment<any>;
    }>
{
  view(vnode) {
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
        return m(AnonymousUser, {
          hideAvatar: true,
          distinguishingKey: item.author,
        });
      }
    }

    const author: Account =
      item instanceof Thread || item instanceof Comment
        ? app.chain.accounts.get(item.author)
        : item.author;

    return (item as Comment<any>).deleted ? (
      <span>[deleted]</span>
    ) : (
      <>
        {m(User, {
          user: author,
          popover: true,
          linkify: true,
          hideAvatar: true,
          showAddressWithDisplayName: true,
        })}
        {item instanceof Thread &&
          item.collaborators &&
          item.collaborators.length > 0 && (
            <>
              <span class="proposal-collaborators"> and </span>
              <Popover
                interactionType="hover"
                transitionDuration={0}
                hoverOpenDelay={500}
                closeOnContentClick
                content={item.collaborators.map(({ address, chain }) => {
                  return m(User, {
                    user: new AddressInfo(null, address, chain, null),
                    linkify: true,
                  });
                })}
                trigger={
                  <a href="#">
                    {pluralize(item.collaborators?.length, 'other')}
                  </a>
                }
              />
            </>
          )}
      </>
    );
  }
}

export class ProposalBodyCreated
  implements
    m.Component<{
      item: AnyProposal | Thread | Comment<any>;
      link: string;
    }>
{
  view(vnode) {
    const { item, link } = vnode.attrs;
    if (!item) return;
    if (!item.createdAt) return;
    const isThread = item instanceof Thread;

    if (item instanceof Thread || item instanceof Comment) {
      return (
        <a
          href={isThread ? `${link}?comment=body` : link}
          onclick={(e) => {
            e.preventDefault();
            const target = isThread ? `${link}?comment=body` : link;
            if (target === document.location.href) return;
            history.replaceState(history.state, '', target);
            jumpHighlightComment(isThread ? 'body' : item.id, false, 500);
          }}
        >
          {item.createdAt.fromNow()}
        </a>
      );
    } else {
      return null;
    }
  }
}

export class ProposalBodyLastEdited
  implements
    m.ClassComponent<{
      item: Thread | Comment<any>;
    }>
{
  view(vnode) {
    const { item } = vnode.attrs;
    if (!item) return;
    const isThread = item instanceof Thread;
    if (!item.lastEdited) {
      return;
    }

    return (
      <a
        href="#"
        onclick={async (e) => {
          e.preventDefault();

          let postWithHistory;

          const grabHistory = isThread && !item.versionHistory?.length;

          if (grabHistory) {
            try {
              postWithHistory = await app.threads.fetchThreadsFromId([item.id]);
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
        }}
      >
        Edited {item.lastEdited.fromNow()}
      </a>
    );
  }
}

export class ProposalBodyEditMenuItem
  implements
    m.Component<{
      item: Thread | Comment<any>;
      parentState;
      proposalPageState: ProposalPageState;
      getSetGlobalEditingStatus;
    }>
{
  view(vnode) {
    const { item, getSetGlobalEditingStatus, proposalPageState, parentState } =
      vnode.attrs;

    if (!item) return;

    if (item instanceof Thread && item.readOnly) return;

    return (
      <MenuItem
        label="Edit"
        onclick={async (e) => {
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
        }}
      />
    );
  }
}

export class ProposalBodyDeleteMenuItem
  implements
    m.ClassComponent<{
      item: Thread | Comment<any>;
      refresh?: () => void;
    }>
{
  view(vnode) {
    const { item, refresh } = vnode.attrs;
    if (!item) return;
    const isThread = item instanceof Thread;

    return (
      <MenuItem
        label="Delete"
        onclick={async (e) => {
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
        }}
      />
    );
  }
}

export class EditCollaboratorsButton
  implements
    m.Component<{
      proposal: Thread;
    }>
{
  view(vnode) {
    const { proposal } = vnode.attrs;

    return (
      <MenuItem
        label="Edit collaborators"
        onclick={async (e) => {
          e.preventDefault();
          app.modals.create({
            modal: EditCollaboratorsModal,
            data: {
              thread: proposal,
            },
          });
        }}
      />
    );
  }
}

export class ProposalBodyCancelEdit
  implements
    m.Component<{
      item;
      getSetGlobalEditingStatus;
      parentState;
    }>
{
  view(vnode) {
    const { item, getSetGlobalEditingStatus, parentState } = vnode.attrs;

    return (
      <CWButton
        label="Cancel"
        disabled={parentState.saving}
        onclick={async (e) => {
          e.preventDefault();
          let confirmed = true;
          const threadText = parentState.quillEditorState.textContentsAsString;
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
        }}
      />
    );
  }
}

export class ProposalBodySaveEdit
  implements
    m.Component<{
      item: Thread | Comment<any>;
      getSetGlobalEditingStatus;
      parentState;
      callback?: () => void; // required for Comments
    }>
{
  view(vnode) {
    const { item, getSetGlobalEditingStatus, parentState, callback } =
      vnode.attrs;
    if (!item) return;

    return (
      <CWButton
        label="Save"
        disabled={parentState.saving}
        onclick={(e) => {
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
            app.comments.edit(item, itemText).then(() => {
              parentState.editing = false;
              parentState.saving = false;
              clearEditingLocalStorage(item, false);
              getSetGlobalEditingStatus(GlobalStatus.Set, false);
              callback();
            });
          }
        }}
      />
    );
  }
}

export class ProposalBodyText
  implements
    m.ClassComponent<{
      item: AnyProposal | Thread | Comment<any>;
    }>
{
  private body: any;
  private collapsed: boolean;

  oninit(vnode) {
    this.collapsed = false;
    formatBody(vnode, true);
  }

  onupdate(vnode) {
    formatBody(vnode, false);
  }

  view(vnode) {
    const { body } = this;

    if (!body) return;

    const getPlaceholder = () => {
      if (!(vnode.attrs.item instanceof Thread)) return;

      const author: Account = app.chain
        ? app.chain.accounts.get(vnode.attrs.item.author)
        : null;

      return author ? (
        <>
          {m(User, {
            user: author,
            hideAvatar: true,
            hideIdentityIcon: true,
          })}{' '}
          created this thread
        </>
      ) : (
        'Created this thread'
      );
    };

    const text = () => {
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

        return (
          <QuillFormattedText
            doc={doc}
            cutoffLines={QUILL_PROPOSAL_LINES_CUTOFF_LENGTH}
            collapse={false}
            hideFormatting={false}
          />
        );
      } catch (e) {
        if (body?.toString().trim() === '') {
          return getPlaceholder();
        }
        return (
          <MarkdownFormattedText
            doc={body}
            cutoffLines={MARKDOWN_PROPOSAL_LINES_CUTOFF_LENGTH}
          />
        );
      }
    };

    return <div>{text()}</div>;
  }
}

export class ProposalBodyAttachments
  implements
    m.Component<{
      item: Thread | Comment<any>;
    }>
{
  view(vnode) {
    const { item } = vnode.attrs;
    if (!item) return;

    return (
      <>
        <CWText>Attachments ({item.attachments.length})</CWText>
        {item.attachments.map((attachment) => (
          <a
            href={attachment.url}
            title={attachment.description}
            target="_blank"
            noopener="noopener"
            noreferrer="noreferrer"
            onclick={(e) => {
              e.preventDefault();
              lity(attachment.url);
            }}
          >
            <img src={attachment.url} />
          </a>
        ))}
      </>
    );
  }
}

export class ProposalBodyEditor
  implements
    m.Component<{
      item: Thread | Comment<any>;
      parentState;
    }>
{
  private restoreEdits: boolean;
  private savedEdits: string;

  async oninit(vnode) {
    const { item } = vnode.attrs;

    const isThread = item instanceof Thread;

    this.savedEdits = isThread
      ? localStorage.getItem(
          `${app.activeChainId()}-edit-thread-${item.id}-storedText`
        )
      : localStorage.getItem(
          `${app.activeChainId()}-edit-comment-${item.id}-storedText`
        );

    if (this.savedEdits) {
      const modalMsg = 'Previous changes found. Restore edits?';

      this.restoreEdits = await confirmationModalWithText(
        modalMsg,
        'Yes',
        'No'
      )();

      clearEditingLocalStorage(item, isThread);

      m.redraw();
    }
  }

  view(vnode) {
    const { item, parentState } = vnode.attrs;
    const { restoreEdits, savedEdits } = this;

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
      return <QuillEditorComponent />;
    }

    return (
      <QuillEditorComponent
        contentsDoc={(() => {
          try {
            const doc = JSON.parse(body);
            if (!doc.ops) throw new Error();
            return doc;
          } catch (e) {
            return body;
          }
        })()}
        oncreateBind={(state) => {
          parentState.quillEditorState = state;
        }}
        imageUploader
        theme="snow"
        editorNamespace={
          isThread ? `edit-thread-${item.id}` : `edit-comment-${item.id}`
        }
      />
    );
  }
}
