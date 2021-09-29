import $ from 'jquery';
import m from 'mithril';
import moment from 'moment';
import { Button, Icon, Icons, Tag, Tooltip, MenuItem, Input } from 'construct-ui';

import app from 'state';
import { navigateToSubpage } from 'app';
import { slugify } from 'utils';

import {
  pluralize, link, externalLink, extractDomain,
  offchainThreadStageToLabel,
} from 'helpers';
import {
  proposalSlugToFriendlyName,
  chainEntityTypeToProposalSlug,
  chainEntityTypeToProposalName,
  ProposalType
} from 'identifiers';

import {
  OffchainThread,
  OffchainThreadKind,
  OffchainThreadStage,
  AnyProposal,
  AddressInfo,
  OffchainVote,
} from 'models';

import { notifyError, notifySuccess } from 'controllers/app/notifications';
import UserGallery from 'views/components/widgets/user_gallery';
import { getStatusClass, getStatusText } from 'views/components/proposal_card';
import User from 'views/components/widgets/user';

import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { alertModalWithText } from 'views/modals/alert_modal';
import { activeQuillEditorHasText, GlobalStatus } from './body';
import { IProposalPageState } from '.';
import { SnapshotProposal } from 'client/scripts/helpers/snapshot_utils';
import OffchainVotingModal from '../../modals/offchain_voting_modal';

export const ProposalHeaderExternalLink: m.Component<{ proposal: AnyProposal | OffchainThread }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    if (!(proposal instanceof OffchainThread)) return;
    if (proposal.kind !== OffchainThreadKind.Link) return;
    return m('.ProposalHeaderExternalLink', [
      externalLink('a.external-link', proposal.url, [
        extractDomain(proposal.url),
        m(Icon, { name: Icons.EXTERNAL_LINK }),
      ]),
    ]);
  }
};

interface IProposalScopedVotes {
  proposalId?: boolean;
}

export const ProposalHeaderOffchainPoll: m.Component<{ proposal: OffchainThread }, { offchainVotes: IProposalScopedVotes }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal.offchainVotingEndsAt) return;

    if (vnode.state.offchainVotes === undefined || vnode.state.offchainVotes[proposal.id] === undefined) {
      // initialize or reset offchain votes
      vnode.state.offchainVotes = {};
      vnode.state.offchainVotes[proposal.id] = true;
      // fetch from backend, and then set
      $.get(`/api/viewOffchainVotes?thread_id=${proposal.id}${
        app.activeChainId() ? `&chain=${app.activeChainId()}`
          : app.activeCommunityId() ? `&community=${app.activeCommunityId()}` : ''}`)
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

    const pollingEnded = proposal.offchainVotingEndsAt?.isBefore(moment().utc());
    const canVote = app.isLoggedIn() && app.user.activeAccount && !pollingEnded
      && !proposal.getOffchainVoteFor(app.user.activeAccount.chain.id, app.user.activeAccount.address);

    const vote = async (option, hasVoted, isSelected) => {
      if (!app.isLoggedIn() || !app.user.activeAccount || isSelected) return;

      const confirmationText = `Submit your vote for '${option}'?`;
      const confirmed = await confirmationModalWithText(confirmationText)();
      if (!confirmed) return;
      // submit vote
      proposal.submitOffchainVote(
        proposal.chain,
        proposal.community,
        app.user.activeAccount.chain.id,
        app.user.activeAccount.address,
        option,
      ).catch(async () => {
        await alertModalWithText('Error submitting vote. Maybe the poll has already ended?')();
      });
    };

    const optionScopedVotes = proposal.offchainVotingOptions.choices.map((option) => {
      return ({
        option,
        votes: proposal.offchainVotes.filter((v) => v.option === option)
      });
    });

    const totalVoteCount = proposal.offchainVotes.length;
    const voteSynopsis = m('.vote-synopsis', [
      optionScopedVotes.map((optionWithVotes) => {
        const optionVoteCount = optionWithVotes.votes.length;
        const optionVotePercentage = (optionVoteCount / totalVoteCount);
        return m('.option-with-votes', [
          m('.option-results-label', [
            m('div', { style: 'font-weight: 500; margin-right: 5px;' }, `${optionWithVotes.option}`),
            m('div', `(${optionVoteCount})`),
          ]),
          m('.poll-bar', { style: `width: ${Math.round(optionVotePercentage * 10000) / 100}%` }),
        ])
      }),
      m('a', {
        href: '#',
        onclick: (e) => {
          e.preventDefault();
          app.modals.create({
            modal: OffchainVotingModal,
            data: { votes: proposal.offchainVotes }
          });
        }
      }, 'See all votes')
    ]);

    return m('.ProposalHeaderOffchainPoll', [
      m('.offchain-poll-header', [
        proposal.offchainVotingOptions?.name || (pollingEnded ? 'Poll closed' : 'Poll open')
      ]),
      !proposal.offchainVotingOptions?.choices && m('.offchain-poll-invalid', '[Error loading poll]'),
      m('.offchain-poll-options', proposal.offchainVotingOptions?.choices?.map((option) => {
        const hasVoted = app.user.activeAccount
          && proposal.getOffchainVoteFor(app.user.activeAccount.chain.id, app.user.activeAccount.address);
        const isSelected = hasVoted?.option === option;
        return m('.offchain-poll-option', [
          m('.offchain-poll-option-left', option),
          m('.offchain-poll-option-right', [
            m(Button, {
              onclick: vote.bind(this, option, hasVoted, isSelected),
              label: isSelected ? 'Voted' : 'Vote',
              size: 'sm',
              rounded: true,
              disabled: !!(pollingEnded || isSelected),
              style: (pollingEnded || isSelected) ? 'pointer-events: none' : '',
              iconLeft: isSelected ? Icons.CHECK : null,
              compact: true,
            }),
          ]),
        ]);
      })),
      m('.offchain-poll-caption', [
        !pollingEnded && [
          // weird hack because we overwrote the moment formatter to display "just now" for future dates
          moment().from(proposal.offchainVotingEndsAt).replace(' ago', ''), ' left'
        ],
        m('br'),
        pollingEnded ? 'Ended ' : 'Ends ',
        proposal.offchainVotingEndsAt?.format('lll'),
      ]),
      m('.offchain-poll-header', 'Voters'),
      m('.offchain-poll-voters', [
        proposal.offchainVotes.length === 0
          ? m('.offchain-poll-no-voters', 'Nobody has voted')
          : voteSynopsis,
      ]),
    ]);
  }
};

export const ProposalHeaderBlockExplorerLink: m.Component<{ proposal: AnyProposal }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal || !proposal['blockExplorerLink']) return;
    return m('.ProposalHeaderBlockExplorerLink', [
      externalLink('a.voting-link', proposal['blockExplorerLink'], [
        proposal['blockExplorerLinkLabel'] || extractDomain(proposal['blockExplorerLink']),
        m(Icon, { name: Icons.EXTERNAL_LINK }),
      ]),
    ]);
  }
};

export const ProposalHeaderExternalSnapshotLink: m.Component<{ proposal: SnapshotProposal, spaceId: string }> = {
  view: (vnode) => {
    const { proposal, spaceId } = vnode.attrs;
    if (!proposal || !proposal.id || !spaceId) return;

    return m('.ProposalHeaderBlockExplorerLink', [
      externalLink('a.voting-link', `https://snapshot.org/#/${spaceId}/proposal/${proposal.id}`, [
        `View on Snapshot`,
        m(Icon, { name: Icons.EXTERNAL_LINK }),
      ]),
    ]);
  }
};

export const ProposalHeaderVotingInterfaceLink: m.Component<{ proposal: AnyProposal }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal || !proposal['votingInterfaceLink']) return;
    return m('.ProposalHeaderVotingInterfaceLink', [
      externalLink('a.voting-link', proposal['votingInterfaceLink'], [
        proposal['votingInterfaceLinkLabel'] || extractDomain(proposal['votingInterfaceLink']),
        m(Icon, { name: Icons.EXTERNAL_LINK }),
      ]),
    ]);
  }
};

export const ProposalHeaderThreadLink: m.Component<{ proposal: AnyProposal }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal || !proposal.threadId) return;
    return m('.ProposalHeaderThreadLink', [
      link('a.thread-link', `/${proposal['chain'] || app.activeId()}/proposal/discussion/${proposal.threadId}`, [
        'Go to discussion',
        m(Icon, { name: Icons.EXTERNAL_LINK }),
      ]),
    ]);
  }
};

export const ProposalHeaderSnapshotThreadLink: m.Component<{ threadId: string }> = {
  view: (vnode) => {
    const { threadId } = vnode.attrs;
    if (!threadId) return;
    const proposalLink = `${app.isCustomDomain() ? '' : `/${app.activeId()}`}/proposal/discussion/${threadId}`;

    return m('.ProposalHeaderThreadLink', [
      link('a.thread-link', proposalLink, [
        'Go to discussion',
        m(Icon, { name: Icons.EXTERNAL_LINK }),
      ]),
    ]);
  }
};

export const ProposalHeaderThreadLinkedChainEntity: m.Component<{ proposal: OffchainThread, chainEntity }> = {
  view: (vnode) => {
    const { proposal, chainEntity } = vnode.attrs;
    const slug = chainEntityTypeToProposalSlug(chainEntity.type);
    if (!slug) return;

    const proposalLink = `${app.isCustomDomain() ? '' : `/${proposal.chain}`
      }/proposal/${slug}/${chainEntity.typeId}`

    return m('.ProposalHeaderThreadLinkedChainEntity', [
      link(
        'a',
          proposalLink,
        [
          `${chainEntityTypeToProposalName(chainEntity.type)} #${chainEntity.typeId}`,
          chainEntity.completed === 't' ? ' (Completed) ' : ' ',
        ],
      ),
    ]);
  }
};

export const ProposalHeaderThreadLinkedSnapshot: m.Component<{ 
  proposal: OffchainThread, 
}, { 
  initialized,
  snapshotProposalsLoaded
  snapshot
}> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal.snapshotProposal) return;
    if (!app.chain?.meta.chain.snapshot) return;
    
    if (!vnode.state.initialized) {
      vnode.state.initialized = true;
      app.snapshot.init(app.chain.meta.chain.snapshot).then(() => {
          // refreshing loads the latest snapshot proposals into app.snapshot.proposals array
        vnode.state.snapshot = app.snapshot.proposals.find((sn) => sn.id === proposal.snapshotProposal);
        vnode.state.snapshotProposalsLoaded = true;
        m.redraw();
      })
    }

    if (vnode.state.snapshotProposalsLoaded && proposal.snapshotProposal !== vnode.state.snapshot) {
      vnode.state.snapshot = app.snapshot.proposals.find((sn) => sn.id === proposal.snapshotProposal);
      m.redraw();
    }

    const proposalLink = `${app.isCustomDomain() ? '' : `/${proposal.chain}`
      }/snapshot/${(app.chain?.meta.chain.snapshot)}/${proposal.snapshotProposal}`;

    return m('.ProposalHeaderThreadLinkedChainEntity', 
    !vnode.state.snapshotProposalsLoaded ? [
      link('a', proposalLink, [`Snapshot: ${proposal.snapshotProposal.slice(0,10)} ...`,]),
    ] : [
      link('a', proposalLink, [`Snapshot: ${vnode.state.snapshot.title.slice(0,20)} ...`,]),
    ]);
  }
};

export const ProposalHeaderSpacer: m.Component<{}> = {
  view: (vnode) => {
    return m('.ProposalHeaderSpacer', m.trust('&middot;'));
  }
};

export const ProposalHeaderTopics: m.Component<{ proposal: AnyProposal | OffchainThread }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    if (!(proposal instanceof OffchainThread)) return;
    if (!proposal.topic) return;

    const topicColor = '#72b483';

    return m('.ProposalHeaderTopics', [
      link('a.proposal-topic', `/${app.activeId()}/discussions/${proposal.topic.name}`, [
        m('span.proposal-topic-name', `${proposal.topic?.name}`),
      ]),
    ]);
  }
};

export const ProposalHeaderTitle: m.Component<{ proposal: AnyProposal | OffchainThread }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    return m('.ProposalHeaderTitle', [
      proposal.title,
      (proposal instanceof OffchainThread && proposal.readOnly) && m(Tag, {
        size: 'xs',
        label: [
          m(Icon, { name: Icons.LOCK, size: 'xs' }),
          ' Locked'
        ],
      }),
    ]);
  }
};

export const ProposalHeaderStage: m.Component<{ proposal: OffchainThread }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    if (proposal.stage?.name === OffchainThreadStage.Discussion) return;

    return m('a.ProposalHeaderStage', {
      href: `/${proposal.chain || proposal.community}?stage=${proposal.stage}`,
      onclick: (e) => {
        e.preventDefault();
        navigateToSubpage(`?stage=${proposal.stage}`);
      },
      class: proposal.stage?.name === OffchainThreadStage.ProposalInReview ? 'positive'
        : proposal.stage?.name === OffchainThreadStage.Voting ? 'positive'
          : proposal.stage?.name === OffchainThreadStage.Passed ? 'positive'
            : proposal.stage?.name === OffchainThreadStage.Failed ? 'negative' : 'positive',
    }, offchainThreadStageToLabel(proposal.stage?.name));
  }
};

export const ProposalHeaderOnchainId: m.Component<{ proposal: AnyProposal }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    return m(
      '.ProposalHeaderOnchainId',
      `${proposalSlugToFriendlyName.get(proposal.slug)} ${proposal.shortIdentifier}`
    );
  }
};

export const ProposalHeaderOnchainStatus: m.Component<{ proposal: AnyProposal }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal) return;
    return m('.ProposalHeaderOnchainStatus', { class: getStatusClass(proposal) }, getStatusText(proposal, true));
  }
};

export const ProposalHeaderViewCount: m.Component<{ viewCount: number }> = {
  view: (vnode) => {
    const { viewCount } = vnode.attrs;
    return m('.ViewCountBlock', pluralize(viewCount, 'view'));
  }
};

export const ProposalTitleEditMenuItem: m.Component<{
  item: AnyProposal,
  proposalPageState: IProposalPageState,
  getSetGlobalEditingStatus: CallableFunction,
  parentState
}> = {
  view: (vnode) => {
    const { item, getSetGlobalEditingStatus, proposalPageState, parentState } = vnode.attrs;
    if (!item) return;

    return m(MenuItem, {
      label: 'Edit title',
      class: 'edit-proposal-title',
      onclick: async (e) => {
        e.preventDefault();
        if (proposalPageState.replying) {
          if (activeQuillEditorHasText()) {
            const confirmed = await confirmationModalWithText('Unsubmitted replies will be lost. Continue?')();
            if (!confirmed) return;
          }
          proposalPageState.replying = false;
          proposalPageState.parentCommentId = null;
        }
        parentState.editing = true;
        getSetGlobalEditingStatus(GlobalStatus.Set, true);
      },
    });
  }
};

// Component for saving chain proposal titles
export const ProposalTitleSaveEdit: m.Component<{
  proposal: AnyProposal,
  getSetGlobalEditingStatus,
  parentState,
}> = {
  view: (vnode) => {
    const { proposal, getSetGlobalEditingStatus, parentState } = vnode.attrs;
    if (!proposal) return;
    const proposalLink = `${app.isCustomDomain() ? '' : `/${app.activeId()}`
    }/proposal/${proposal.slug}/${proposal.identifier}`
      + `-${slugify(proposal.title)}`;

    return m('.ProposalTitleSaveEdit', [
      m(Button, {
        class: 'save-editing',
        label: 'Save',
        disabled: parentState.saving,
        intent: 'primary',
        rounded: true,
        onclick: (e) => {
          e.preventDefault();
          parentState.saving = true;
          app.chain.chainEntities.updateEntityTitle(
            proposal.uniqueIdentifier,
            parentState.updatedTitle
          ).then((response) => {
            m.route.set(proposalLink);
            parentState.editing = false;
            parentState.saving = false;
            getSetGlobalEditingStatus(GlobalStatus.Set, false);
            proposal.title = parentState.updatedTitle;
            m.redraw();
            notifySuccess('Thread successfully edited');
          });
        }
      }, 'Save'),
    ]);
  }
};

export const ProposalTitleCancelEdit: m.Component<{ proposal, getSetGlobalEditingStatus, parentState }> = {
  view: (vnode) => {
    const { proposal, getSetGlobalEditingStatus, parentState } = vnode.attrs;

    return m('.ProposalTitleCancelEdit', [
      m(Button, {
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
        }
      }, 'Cancel')
    ]);
  }
};

export const ProposalTitleEditor: m.Component<{
  item: OffchainThread | AnyProposal,
  getSetGlobalEditingStatus,
  parentState
}> = {
  oninit: (vnode) => {
    vnode.attrs.parentState.updatedTitle = vnode.attrs.item.title;
  },
  view: (vnode) => {
    const { item, parentState, getSetGlobalEditingStatus } = vnode.attrs;
    if (!item) return;
    const isThread = (item instanceof OffchainThread);

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
      !isThread && m('.proposal-title-buttons', [
        m(ProposalTitleSaveEdit, {
          proposal: (item as AnyProposal), getSetGlobalEditingStatus, parentState
        }),
        m(ProposalTitleCancelEdit, {
          proposal: (item as AnyProposal), getSetGlobalEditingStatus, parentState
        })
      ])
    ]);
  }
};

export const ProposalLinkEditor: m.Component<{
  item: OffchainThread | AnyProposal,
  parentState
}> = {
  oninit: (vnode) => {
    vnode.attrs.parentState.updatedUrl = (vnode.attrs.item as OffchainThread).url;
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
      })
    ]);
  }
};

export const ProposalHeaderPrivacyMenuItems: m.Component<{
  proposal: AnyProposal | OffchainThread,
  getSetGlobalEditingStatus: CallableFunction
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
          app.threads.setPrivacy({
            threadId: proposal.id,
            readOnly: !proposal.readOnly,
          }).then(() => {
            getSetGlobalEditingStatus(GlobalStatus.Set, false);
            m.redraw();
          });
        },
        label: proposal.readOnly ? 'Unlock thread' : 'Lock thread',
      }),
    ];
  }
};

export const ProposalSidebarPollEditorModule: m.Component<{
  proposal,
  openPollEditor: Function
}, {
  isOpen: boolean
}> = {
  view: (vnode) => {
    const { proposal, openPollEditor } = vnode.attrs;
    return m('.ProposalSidebarPollEditorModule', [
      m('.placeholder-copy', 'Add an offchain poll to this thread?'),
      m(Button, {
        rounded: true,
        compact: true,
        fluid: true,
        disabled: !!proposal.offchainVotingEndsAt,
        label: proposal.offchainVotingEndsAt ? 'Polling enabled' : 'Create a poll',
        onclick: (e) => {
          e.preventDefault();
          openPollEditor();
        },
      })
    ]);
  }
};

export const ProposalSidebarLinkedViewer: m.Component<{
  proposal: OffchainThread
}> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;

    return m('.ProposalSidebarLinkedViewer', [
      (proposal.chainEntities.length > 0 || proposal.snapshotProposal?.length > 0) 
        ? m('.placeholder-copy', 'Proposals for this thread:')
        : m('.placeholder-copy', app.chain ? 'Connect an on-chain proposal?' : 'Track the progress of this thread?'),
      proposal.chainEntities.length > 0 && m('.proposal-chain-entities', [
        proposal.chainEntities.map((chainEntity) => {
          return m(ProposalHeaderThreadLinkedChainEntity, { proposal, chainEntity });
        }),
      ]),
      proposal.snapshotProposal?.length > 0 && m(ProposalHeaderThreadLinkedSnapshot, { proposal }),
    ])
  }
}

export const ProposalSidebarStageEditorModule: m.Component<{
  proposal: OffchainThread,
  openStageEditor: Function
}, {
  isOpen: boolean
}> = {
  view: (vnode) => {
    const { proposal, openStageEditor } = vnode.attrs;

    if (!app.chain?.meta?.chain && !app.community?.meta) return;
    const { stagesEnabled } = app.chain?.meta?.chain || app.community?.meta;
    if (!stagesEnabled) return;

    return m('.ProposalSidebarStageEditorModule', [
      m(Button, {
        rounded: true,
        compact: true,
        fluid: true,
        label: app.chain ? 'Connect a proposal' : 'Update status',
        onclick: (e) => {
          e.preventDefault();
          openStageEditor();
        },
      })
    ]);
  }
};
