/* @jsx m */
/* eslint-disable max-classes-per-file */

import m from 'mithril';
import { MenuItem } from 'construct-ui';

import 'pages/view_proposal/proposal_header_components.scss';

import app from 'state';
import { navigateToSubpage } from 'app';
import { slugify } from 'utils';
import { pluralize, threadStageToLabel } from 'helpers';
import { getProposalUrlPath, proposalSlugToFriendlyName } from 'identifiers';
import { Thread, ThreadStage, AnyProposal } from 'models';
import { notifySuccess } from 'controllers/app/notifications';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import {
  getStatusClass,
  getStatusText,
} from '../../components/proposal_card/helpers';
import { CWText } from '../../components/component_kit/cw_text';
import { getClasses } from '../../components/component_kit/helpers';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { GlobalStatus, ProposalPageState } from './types';
import { activeQuillEditorHasText } from './helpers';

export class ProposalHeaderStage
  implements m.ClassComponent<{ proposal: Thread }>
{
  view(vnode) {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    if (proposal.stage === ThreadStage.Discussion) return;

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
      proposal: AnyProposal | Thread;
    }>
{
  view(vnode) {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    if (!(proposal instanceof Thread)) return;
    if (!proposal.topic) return;

    return (
      <CWText
        onclick={() =>
          m.route.set(
            `/${app.activeChainId()}/discussions/${proposal.topic.name}`
          )
        }
      >
        {proposal.topic?.name}
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

    if (!proposal) return;

    return (
      <div class="ProposalHeaderTitle">
        {proposal.title}
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
    if (!proposal) return;

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
    if (!proposal) return;

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
      item: AnyProposal;
      proposalPageState: ProposalPageState;
      getSetGlobalEditingStatus: CallableFunction;
      parentState;
    }>
{
  view(vnode) {
    const { item, getSetGlobalEditingStatus, proposalPageState, parentState } =
      vnode.attrs;
    if (!item) return;

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
          getSetGlobalEditingStatus(GlobalStatus.Set, true);
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
      getSetGlobalEditingStatus;
      parentState;
    }>
{
  view(vnode) {
    const { proposal, getSetGlobalEditingStatus, parentState } = vnode.attrs;

    if (!proposal) return;

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
              getSetGlobalEditingStatus(GlobalStatus.Set, false);
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
      getSetGlobalEditingStatus;
      parentState;
    }>
{
  view(vnode) {
    const { getSetGlobalEditingStatus, parentState } = vnode.attrs;

    return (
      <CWButton
        label="Cancel"
        disabled={parentState.saving}
        onclick={async (e) => {
          e.preventDefault();
          parentState.editing = false;
          parentState.saving = false;
          getSetGlobalEditingStatus(GlobalStatus.Set, false);
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
      getSetGlobalEditingStatus;
      parentState;
    }>
{
  oninit(vnode) {
    vnode.attrs.parentState.updatedTitle = vnode.attrs.item.title;
  }

  view(vnode) {
    const { item, parentState, getSetGlobalEditingStatus } = vnode.attrs;

    if (!item) return;

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
              getSetGlobalEditingStatus={getSetGlobalEditingStatus}
              parentState={parentState}
            />
            <ProposalTitleCancelEdit
              getSetGlobalEditingStatus={getSetGlobalEditingStatus}
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
      item: Thread | AnyProposal;
      parentState;
    }>
{
  oninit(vnode) {
    vnode.attrs.parentState.updatedUrl = (vnode.attrs.item as Thread).url;
  }

  view(vnode) {
    const { item, parentState } = vnode.attrs;
    if (!item) return;

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
      proposal: AnyProposal | Thread;
      getSetGlobalEditingStatus: CallableFunction;
    }>
{
  view(vnode) {
    const { proposal, getSetGlobalEditingStatus } = vnode.attrs;
    if (!proposal) return;
    if (!(proposal instanceof Thread)) return;

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
              getSetGlobalEditingStatus(GlobalStatus.Set, false);
              m.redraw();
            });
        }}
        label={proposal.readOnly ? 'Unlock thread' : 'Lock thread'}
      />
    );
  }
}
