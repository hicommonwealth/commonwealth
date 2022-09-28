/* @jsx m */
/* eslint-disable max-classes-per-file */
/* eslint-disable no-restricted-globals */

import m from 'mithril';
import { MenuItem, Popover } from 'construct-ui';

import 'pages/view_proposal/proposal_header_components.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { slugify } from 'utils';
import { pluralize, threadStageToLabel } from 'helpers';
import { getProposalUrlPath, proposalSlugToFriendlyName } from 'identifiers';
import {
  Account,
  Comment,
  Thread,
  ThreadStage,
  AnyProposal,
  AddressInfo,
} from 'models';
import VersionHistoryModal from 'views/modals/version_history_modal';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { ChainType } from 'common-common/src/types';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import {
  getStatusClass,
  getStatusText,
} from '../../components/proposal_card/helpers';
import User, { AnonymousUser } from '../../components/widgets/user';
import { CWText } from '../../components/component_kit/cw_text';
import { getClasses } from '../../components/component_kit/helpers';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { ProposalPageState } from './types';
import { activeQuillEditorHasText, jumpHighlightComment } from './helpers';
import { EditCollaboratorsModal } from '../../modals/edit_collaborators_modal';

export class ProposalHeaderStage
  implements m.ClassComponent<{ proposal: Thread }>
{
  view(vnode) {
    const { proposal } = vnode.attrs;

    return (
      <CWText
        className={getClasses<{ stage: 'negative' | 'positive' }>(
          {
            stage:
              proposal.stage === ThreadStage.ProposalInReview
                ? 'positive'
                : proposal.stage === ThreadStage.Voting
                ? 'positive'
                : proposal.stage === ThreadStage.Passed
                ? 'positive'
                : proposal.stage === ThreadStage.Failed
                ? 'negative'
                : 'positive',
          },
          'proposal-stage-text'
        )}
        onclick={(e) => {
          e.preventDefault();
          navigateToSubpage(`?stage=${proposal.stage}`);
        }}
      >
        {threadStageToLabel(proposal.stage)}
      </CWText>
    );
  }
}

export class ProposalHeaderTopics
  implements
    m.ClassComponent<{
      proposalTopic: string;
    }>
{
  view(vnode) {
    const { proposalTopic } = vnode.attrs;

    return (
      <CWText
        onclick={() =>
          m.route.set(`/${app.activeChainId()}/discussions/${proposalTopic}`)
        }
      >
        {proposalTopic}
      </CWText>
    );
  }
}

export class ProposalHeaderTitle
  implements
    m.ClassComponent<{
      proposal: AnyProposal | Thread;
    }>
{
  view(vnode) {
    const { proposal } = vnode.attrs;

    return (
      <div class="ProposalHeaderTitle">
        <CWText type="h3" fontWeight="semiBold">
          {proposal.title}
        </CWText>
        {proposal instanceof Thread && proposal.readOnly && (
          <CWIcon iconName="lock" iconSize="small" />
        )}
      </div>
    );
  }
}

export class ProposalHeaderOnchainId
  implements m.ClassComponent<{ proposal: AnyProposal }>
{
  view(vnode) {
    const { proposal } = vnode.attrs;

    return (
      <CWText>
        {proposalSlugToFriendlyName.get(proposal.slug)}{' '}
        {proposal.shortIdentifier}
      </CWText>
    );
  }
}

export class ProposalHeaderOnchainStatus
  implements
    m.ClassComponent<{
      proposal: AnyProposal;
    }>
{
  view(vnode) {
    const { proposal } = vnode.attrs;

    return (
      <CWText className={`onchain-status-text ${getStatusClass(proposal)}`}>
        {getStatusText(proposal)}
      </CWText>
    );
  }
}

export class ProposalHeaderViewCount
  implements m.ClassComponent<{ viewCount: number }>
{
  view(vnode) {
    const { viewCount } = vnode.attrs;

    return <CWText>{pluralize(viewCount, 'view')}</CWText>;
  }
}

export class ProposalTitleEditMenuItem
  implements
    m.ClassComponent<{
      proposalPageState: ProposalPageState;
      setIsGloballyEditing: (status: boolean) => void;
      parentState;
    }>
{
  view(vnode) {
    const { setIsGloballyEditing, proposalPageState, parentState } =
      vnode.attrs;

    return (
      <MenuItem
        label="Edit title"
        onclick={async (e) => {
          e.preventDefault();
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

          setIsGloballyEditing(true);
        }}
      />
    );
  }
}

// Component for saving chain proposal titles
export class ProposalTitleSaveEdit
  implements
    m.ClassComponent<{
      proposal: AnyProposal;
      setIsGloballyEditing: (status: boolean) => void;
      parentState;
    }>
{
  view(vnode) {
    const { proposal, setIsGloballyEditing, parentState } = vnode.attrs;

    const proposalLink = getProposalUrlPath(
      proposal.slug,
      `${proposal.identifier}-${slugify(proposal.title)}`
    );

    return (
      <CWButton
        label="Save"
        disabled={parentState.saving}
        onclick={(e) => {
          e.preventDefault();

          parentState.saving = true;

          app.chain.chainEntities
            .updateEntityTitle(
              proposal.uniqueIdentifier,
              parentState.updatedTitle
            )
            .then(() => {
              m.route.set(proposalLink);

              parentState.editing = false;

              parentState.saving = false;

              setIsGloballyEditing(false);

              proposal.title = parentState.updatedTitle;

              m.redraw();

              notifySuccess('Thread successfully edited');
            });
        }}
      />
    );
  }
}

export class ProposalTitleCancelEdit
  implements
    m.ClassComponent<{
      setIsGloballyEditing: (status: boolean) => void;
      parentState;
    }>
{
  view(vnode) {
    const { setIsGloballyEditing, parentState } = vnode.attrs;

    return (
      <CWButton
        label="Cancel"
        disabled={parentState.saving}
        onclick={async (e) => {
          e.preventDefault();
          parentState.editing = false;
          parentState.saving = false;
          setIsGloballyEditing(false);
          m.redraw();
        }}
      />
    );
  }
}

export class ProposalTitleEditor
  implements
    m.ClassComponent<{
      item: Thread | AnyProposal;
      setIsGloballyEditing: (status: boolean) => void;
      parentState;
    }>
{
  oninit(vnode) {
    vnode.attrs.parentState.updatedTitle = vnode.attrs.item.title;
  }

  view(vnode) {
    const { item, parentState, setIsGloballyEditing } = vnode.attrs;

    const isThread = item instanceof Thread;

    return (
      <div class="ProposalTitleEditor">
        <CWTextInput
          name="edit-thread-title"
          oninput={(e) => {
            const { value } = (e as any).target;
            parentState.updatedTitle = value;
          }}
          value={parentState.updatedTitle}
        />
        {!isThread && (
          <>
            <ProposalTitleSaveEdit
              proposal={item as AnyProposal}
              setIsGloballyEditing={setIsGloballyEditing}
              parentState={parentState}
            />
            <ProposalTitleCancelEdit
              setIsGloballyEditing={setIsGloballyEditing}
              parentState={parentState}
            />
          </>
        )}
      </div>
    );
  }
}

export class ProposalLinkEditor
  implements
    m.ClassComponent<{
      parentState;
    }>
{
  oninit(vnode) {
    vnode.attrs.parentState.updatedUrl = (vnode.attrs.item as Thread).url;
  }

  view(vnode) {
    const { parentState } = vnode.attrs;

    return (
      <CWTextInput
        name="edit-thread-url"
        oninput={(e) => {
          const { value } = (e as any).target;
          parentState.updatedUrl = value;
        }}
        value={parentState.updatedUrl}
      />
    );
  }
}

export class ProposalHeaderPrivacyMenuItems
  implements
    m.ClassComponent<{
      proposal: Thread;
      setIsGloballyEditing: (status: boolean) => void;
    }>
{
  view(vnode) {
    const { proposal, setIsGloballyEditing } = vnode.attrs;

    return (
      <MenuItem
        onclick={(e) => {
          e.preventDefault();
          app.threads
            .setPrivacy({
              threadId: proposal.id,
              readOnly: !proposal.readOnly,
            })
            .then(() => {
              setIsGloballyEditing(false);
              m.redraw();
            });
        }}
        label={proposal.readOnly ? 'Unlock thread' : 'Lock thread'}
      />
    );
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
      setIsGloballyEditing: (status: boolean) => void;
    }>
{
  view(vnode) {
    const { item, setIsGloballyEditing, proposalPageState, parentState } =
      vnode.attrs;

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

          setIsGloballyEditing(true);
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
