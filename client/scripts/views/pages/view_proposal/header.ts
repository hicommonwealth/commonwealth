/* eslint-disable @typescript-eslint/ban-types */
import $ from 'jquery';
import m from 'mithril';
import moment from 'moment';
import { Button, Icons, Tag, MenuItem, Input } from 'construct-ui';

import app from 'state';
import { navigateToSubpage } from 'app';
import { slugify } from 'utils';

import {
  pluralize,
  link,
  externalLink,
  extractDomain,
  offchainThreadStageToLabel,
} from 'helpers';
import { getProposalUrlPath, proposalSlugToFriendlyName } from 'identifiers';
import {
  OffchainThread,
  OffchainThreadKind,
  OffchainThreadStage,
  AnyProposal,
} from 'models';
import { ProposalType } from 'types';

import { notifyError, notifySuccess } from 'controllers/app/notifications';

import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { alertModalWithText } from 'views/modals/alert_modal';
import { SnapshotProposal } from 'client/scripts/helpers/snapshot_utils';
import TopicGateCheck from 'controllers/chain/ethereum/gatedTopic';
import { activeQuillEditorHasText, GlobalStatus } from './body';
import { IProposalPageState } from '.';
import OffchainVotingModal from '../../modals/offchain_voting_modal';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import {
  getStatusClass,
  getStatusText,
} from '../../components/proposal_card/helpers';

export const ProposalHeaderExternalLink: m.Component<{
  proposal: AnyProposal | OffchainThread;
}> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    if (!(proposal instanceof OffchainThread)) return;
    if (proposal.kind !== OffchainThreadKind.Link) return;
    return m('.ProposalHeaderExternalLink', [
      externalLink('a.external-link', proposal.url, [
        extractDomain(proposal.url),
        m(CWIcon, { iconName: 'externalLink' }),
      ]),
    ]);
  },
};

interface IProposalScopedVotes {
  proposalId?: boolean;
}

export const ProposalHeaderOffchainPoll: m.Component<
  { proposal: OffchainThread },
  { offchainVotes: IProposalScopedVotes }
> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal.offchainVotingEnabled) return;

    if (
      vnode.state.offchainVotes === undefined ||
      vnode.state.offchainVotes[proposal.id] === undefined
    ) {
      // initialize or reset offchain votes
      vnode.state.offchainVotes = {};
      vnode.state.offchainVotes[proposal.id] = true;
      // fetch from backend, and then set
      $.get(
        `/api/viewOffchainVotes?thread_id=${proposal.id}${
          app.activeChainId() ? `&chain=${app.activeChainId()}` : ''
        }`
      )
        .then((result) => {
          if (result.result.length === 0) return;
          if (result.result[0].thread_id !== proposal.id) return;
          proposal.setOffchainVotes(result.result);
          m.redraw();
        })
        .catch(async (err) => {
          notifyError('Unexpected error loading offchain votes');
        });
    }

    const pollingEnded =
      proposal.offchainVotingEndsAt &&
      proposal.offchainVotingEndsAt?.isBefore(moment().utc());

    const tokenThresholdFailed = TopicGateCheck.isGatedTopic(
      proposal.topic.name
    );

    const vote = async (option, hasVoted, isSelected) => {
      if (!app.isLoggedIn() || !app.user.activeAccount || isSelected) return;

      const confirmationText = `Submit your vote for '${option}'?`;
      const confirmed = await confirmationModalWithText(confirmationText)();
      if (!confirmed) return;
      // submit vote
      proposal
        .submitOffchainVote(
          proposal.chain,
          proposal.community,
          app.user.activeAccount.chain.id,
          app.user.activeAccount.address,
          option
        )
        .catch(async () => {
          await alertModalWithText(
            'Error submitting vote. Maybe the poll has already ended?'
          )();
        });
    };

    const optionScopedVotes = proposal.offchainVotingOptions.choices.map(
      (option) => {
        return {
          option,
          votes: proposal.offchainVotes.filter((v) => v.option === option),
        };
      }
    );

    const totalVoteCount = proposal.offchainVotes.length;
    const voteSynopsis = m('.vote-synopsis', [
      optionScopedVotes.map((optionWithVotes) => {
        const optionVoteCount = optionWithVotes.votes.length;
        const optionVotePercentage = optionVoteCount / totalVoteCount;
        return m('.option-with-votes', [
          m('.option-results-label', [
            m(
              'div',
              { style: 'font-weight: 500; margin-right: 5px;' },
              `${optionWithVotes.option}`
            ),
            m('div', `(${optionVoteCount})`),
          ]),
          m('.poll-bar', {
            style: `width: ${Math.round(optionVotePercentage * 10000) / 100}%`,
          }),
        ]);
      }),
      m(
        'a',
        {
          href: '#',
          onclick: (e) => {
            e.preventDefault();
            app.modals.create({
              modal: OffchainVotingModal,
              data: { votes: proposal.offchainVotes },
            });
          },
        },
        'See all votes'
      ),
    ]);

    return m('.ProposalHeaderOffchainPoll', [
      m('.offchain-poll-header', [
        proposal.offchainVotingOptions?.name ||
          (pollingEnded ? 'Poll closed' : 'Poll open'),
      ]),
      !proposal.offchainVotingOptions?.choices &&
        m('.offchain-poll-invalid', '[Error loading poll]'),
      m(
        '.offchain-poll-options',
        proposal.offchainVotingOptions?.choices?.map((option) => {
          const hasVoted =
            app.user.activeAccount &&
            proposal.getOffchainVoteFor(
              app.user.activeAccount.chain.id,
              app.user.activeAccount.address
            );
          const isSelected = hasVoted?.option === option;
          return m('.offchain-poll-option', [
            m('.offchain-poll-option-left', option),
            m('.offchain-poll-option-right', [
              m(Button, {
                onclick: vote.bind(this, option, hasVoted, isSelected),
                label: isSelected ? 'Voted' : 'Vote',
                size: 'sm',
                rounded: true,
                disabled: pollingEnded || isSelected || tokenThresholdFailed,
                style: pollingEnded || isSelected ? 'pointer-events: none' : '',
                iconLeft: isSelected ? Icons.CHECK : null,
                compact: true,
              }),
            ]),
          ]);
        })
      ),
      m('.offchain-poll-caption', [
        proposal.offchainVotingEndsAt
          ? [
              !pollingEnded &&
                moment()
                  .from(proposal.offchainVotingEndsAt)
                  .replace(' ago', ''),
              !pollingEnded && ' left',
              m('br'),
              !pollingEnded && 'Ends ',
              pollingEnded && 'Ended ',
              proposal.offchainVotingEndsAt?.format('lll'),
            ]
          : 'Poll does not expire.',
      ]),
      m('.offchain-poll-header', 'Voters'),
      m('.offchain-poll-voters', [
        proposal.offchainVotes.length === 0
          ? m('.offchain-poll-no-voters', 'Nobody has voted')
          : voteSynopsis,
      ]),
    ]);
  },
};

export const ProposalHeaderBlockExplorerLink: m.Component<{
  proposal: AnyProposal;
}> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal || !proposal['blockExplorerLink']) return;
    return m('.ProposalHeaderBlockExplorerLink', [
      externalLink('a.voting-link', proposal['blockExplorerLink'], [
        proposal['blockExplorerLinkLabel'] ||
          extractDomain(proposal['blockExplorerLink']),
        m(CWIcon, { iconName: 'externalLink' }),
      ]),
    ]);
  },
};

export const ProposalHeaderExternalSnapshotLink: m.Component<{
  proposal: SnapshotProposal;
  spaceId: string;
}> = {
  view: (vnode) => {
    const { proposal, spaceId } = vnode.attrs;
    if (!proposal || !proposal.id || !spaceId) return;

    return m('.ProposalHeaderBlockExplorerLink', [
      externalLink(
        'a.voting-link',
        `https://snapshot.org/#/${spaceId}/proposal/${proposal.id}`,
        [`View on Snapshot`, m(CWIcon, { iconName: 'externalLink' })]
      ),
    ]);
  },
};

export const ProposalHeaderVotingInterfaceLink: m.Component<{
  proposal: AnyProposal;
}> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal || !proposal['votingInterfaceLink']) return;
    return m('.ProposalHeaderVotingInterfaceLink', [
      externalLink('a.voting-link', proposal['votingInterfaceLink'], [
        proposal['votingInterfaceLinkLabel'] ||
          extractDomain(proposal['votingInterfaceLink']),
        m(CWIcon, { iconName: 'externalLink', iconSize: 'small' }),
      ]),
    ]);
  },
};

export const ProposalHeaderThreadLink: m.Component<{ proposal: AnyProposal }> =
  {
    view: (vnode) => {
      const { proposal } = vnode.attrs;
      if (!proposal || !proposal.threadId) return;
      const path = getProposalUrlPath(
        ProposalType.OffchainThread,
        `${proposal.threadId}`,
        false,
        proposal['chain']
      );
      return m('.ProposalHeaderThreadLink', [
        link('a.thread-link', path, [
          'Go to discussion',
          m(CWIcon, { iconName: 'externalLink', iconSize: 'small' }),
        ]),
      ]);
    },
  };

export const ProposalHeaderSnapshotThreadLink: m.Component<{
  thread: { id: string; title: string };
}> = {
  view: (vnode) => {
    const { id, title } = vnode.attrs.thread;
    if (!id) return;
    const proposalLink = getProposalUrlPath(ProposalType.OffchainThread, id);

    return m('.ProposalHeaderThreadLink', [
      link('a.thread-link', proposalLink, [
        decodeURIComponent(title),
        m(CWIcon, { iconName: 'externalLink', iconSize: 'small' }),
      ]),
    ]);
  },
};

export const ProposalHeaderSpacer: m.Component<{}> = {
  view: (vnode) => {
    return m('.ProposalHeaderSpacer', m.trust('&middot;'));
  },
};

export const ProposalHeaderTopics: m.Component<{
  proposal: AnyProposal | OffchainThread;
}> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    if (!(proposal instanceof OffchainThread)) return;
    if (!proposal.topic) return;

    const topicColor = '#72b483';

    return m('.ProposalHeaderTopics', [
      link(
        'a.proposal-topic',
        `/${app.activeChainId()}/discussions/${proposal.topic.name}`,
        [m('span.proposal-topic-name', `${proposal.topic?.name}`)]
      ),
    ]);
  },
};

export const ProposalHeaderTitle: m.Component<{
  proposal: AnyProposal | OffchainThread;
}> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    return m('.ProposalHeaderTitle', [
      proposal.title,
      proposal instanceof OffchainThread &&
        proposal.readOnly &&
        m(Tag, {
          size: 'xs',
          label: [
            m(CWIcon, { iconName: 'lock', iconSize: 'small' }),
            ' Locked',
          ],
        }),
    ]);
  },
};

export const ProposalHeaderStage: m.Component<{ proposal: OffchainThread }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    if (proposal.stage === OffchainThreadStage.Discussion) return;

    return m(
      'a.ProposalHeaderStage',
      {
        href: `/${proposal.chain || proposal.community}?stage=${
          proposal.stage
        }`,
        onclick: (e) => {
          e.preventDefault();
          navigateToSubpage(`?stage=${proposal.stage}`);
        },
        class:
          proposal.stage === OffchainThreadStage.ProposalInReview
            ? 'positive'
            : proposal.stage === OffchainThreadStage.Voting
            ? 'positive'
            : proposal.stage === OffchainThreadStage.Passed
            ? 'positive'
            : proposal.stage === OffchainThreadStage.Failed
            ? 'negative'
            : 'positive',
      },
      offchainThreadStageToLabel(proposal.stage)
    );
  },
};

export const ProposalHeaderOnchainId: m.Component<{ proposal: AnyProposal }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    return m(
      '.ProposalHeaderOnchainId',
      `${proposalSlugToFriendlyName.get(proposal.slug)} ${
        proposal.shortIdentifier
      }`
    );
  },
};

export const ProposalHeaderOnchainStatus: m.Component<{
  proposal: AnyProposal;
}> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    return m(
      '.ProposalHeaderOnchainStatus',
      { class: getStatusClass(proposal) },
      getStatusText(proposal)
    );
  },
};

export const ProposalHeaderViewCount: m.Component<{ viewCount: number }> = {
  view: (vnode) => {
    const { viewCount } = vnode.attrs;
    return m('.ViewCountBlock', pluralize(viewCount, 'view'));
  },
};

// export const ProposalHeaderLinkThreadsMenuItem: m.Component<
//   {
//     item: OffchainThread;
//   },
//   {}
// > = {
//   view: (vnode) => {
//     const { item } = vnode.attrs;
//     return m(MenuItem, {
//       label: 'Link offchain thread',
//       class: 'link-offchain-thread',
//       onclick: async (e) => {
//         e.preventDefault();
//         app.modals.create({
//           modal: LinkedThreadModal,
//           data: { linkingProposal: item },
//         });
//       },
//     });
//   },
// };

export const ProposalTitleEditMenuItem: m.Component<{
  item: AnyProposal;
  proposalPageState: IProposalPageState;
  getSetGlobalEditingStatus: CallableFunction;
  parentState;
}> = {
  view: (vnode) => {
    const { item, getSetGlobalEditingStatus, proposalPageState, parentState } =
      vnode.attrs;
    if (!item) return;

    return m(MenuItem, {
      label: 'Edit title',
      class: 'edit-proposal-title',
      onclick: async (e) => {
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
      },
    });
  },
};

// Component for saving chain proposal titles
export const ProposalTitleSaveEdit: m.Component<{
  proposal: AnyProposal;
  getSetGlobalEditingStatus;
  parentState;
}> = {
  view: (vnode) => {
    const { proposal, getSetGlobalEditingStatus, parentState } = vnode.attrs;
    if (!proposal) return;
    const proposalLink = getProposalUrlPath(
      proposal.slug,
      `${proposal.identifier}-${slugify(proposal.title)}`
    );

    return m('.ProposalTitleSaveEdit', [
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
            parentState.saving = true;
            app.chain.chainEntities
              .updateEntityTitle(
                proposal.uniqueIdentifier,
                parentState.updatedTitle
              )
              .then((response) => {
                m.route.set(proposalLink);
                parentState.editing = false;
                parentState.saving = false;
                getSetGlobalEditingStatus(GlobalStatus.Set, false);
                proposal.title = parentState.updatedTitle;
                m.redraw();
                notifySuccess('Thread successfully edited');
              });
          },
        },
        'Save'
      ),
    ]);
  },
};

export const ProposalTitleCancelEdit: m.Component<{
  proposal;
  getSetGlobalEditingStatus;
  parentState;
}> = {
  view: (vnode) => {
    const { proposal, getSetGlobalEditingStatus, parentState } = vnode.attrs;

    return m('.ProposalTitleCancelEdit', [
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
            parentState.editing = false;
            parentState.saving = false;
            getSetGlobalEditingStatus(GlobalStatus.Set, false);
            m.redraw();
          },
        },
        'Cancel'
      ),
    ]);
  },
};

export const ProposalTitleEditor: m.Component<{
  item: OffchainThread | AnyProposal;
  getSetGlobalEditingStatus;
  parentState;
}> = {
  oninit: (vnode) => {
    vnode.attrs.parentState.updatedTitle = vnode.attrs.item.title;
  },
  view: (vnode) => {
    const { item, parentState, getSetGlobalEditingStatus } = vnode.attrs;
    if (!item) return;
    const isThread = item instanceof OffchainThread;

    return m('.ProposalTitleEditor', [
      m(Input, {
        size: 'lg',
        name: 'edit-thread-title',
        autocomplete: 'off',
        oninput: (e) => {
          const { value } = (e as any).target;
          parentState.updatedTitle = value;
        },
        defaultValue: parentState.updatedTitle,
        tabindex: 1,
      }),
      !isThread &&
        m('.proposal-title-buttons', [
          m(ProposalTitleSaveEdit, {
            proposal: item as AnyProposal,
            getSetGlobalEditingStatus,
            parentState,
          }),
          m(ProposalTitleCancelEdit, {
            proposal: item as AnyProposal,
            getSetGlobalEditingStatus,
            parentState,
          }),
        ]),
    ]);
  },
};

export const ProposalLinkEditor: m.Component<{
  item: OffchainThread | AnyProposal;
  parentState;
}> = {
  oninit: (vnode) => {
    vnode.attrs.parentState.updatedUrl = (
      vnode.attrs.item as OffchainThread
    ).url;
  },
  view: (vnode) => {
    const { item, parentState } = vnode.attrs;
    if (!item) return;

    return m('.ProposalLinkEditor', [
      m(Input, {
        size: 'lg',
        name: 'edit-thread-url',
        autocomplete: 'off',
        oninput: (e) => {
          const { value } = (e as any).target;
          parentState.updatedUrl = value;
        },
        defaultValue: parentState.updatedUrl,
        tabindex: 1,
      }),
    ]);
  },
};

export const ProposalHeaderPrivacyMenuItems: m.Component<{
  proposal: AnyProposal | OffchainThread;
  getSetGlobalEditingStatus: CallableFunction;
}> = {
  view: (vnode) => {
    const { proposal, getSetGlobalEditingStatus } = vnode.attrs;
    if (!proposal) return;
    if (!(proposal instanceof OffchainThread)) return;

    return [
      m(MenuItem, {
        class: 'read-only-toggle',
        onclick: (e) => {
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
        },
        label: proposal.readOnly ? 'Unlock thread' : 'Lock thread',
      }),
    ];
  },
};
