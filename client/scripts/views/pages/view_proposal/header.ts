import $ from 'jquery';
import m from 'mithril';
import moment from 'moment';
import app from 'state';
import { slugify } from 'utils';

import { Button, Icon, Icons, Tag, Tooltip, MenuItem, Input } from 'construct-ui';

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
} from 'models';

import { notifyError } from 'controllers/app/notifications';
import UserGallery from 'views/components/widgets/user_gallery';
import { getStatusClass, getStatusText } from 'views/components/proposal_card';
import User from 'views/components/widgets/user';
import { notifySuccess } from 'controllers/app/notifications';
import { activeQuillEditorHasText, GlobalStatus } from './body';
import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { alertModalWithText } from 'views/modals/alert_modal';

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

export const ProposalHeaderOffchainPoll: m.Component<{ proposal: OffchainThread }, { offchainVotes }> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal.offchainVotingEndsAt) return;

    if (vnode.state.offchainVotes === undefined || vnode.state.offchainVotes[proposal.id] === undefined) {
      // initialize or reset offchain votes
      vnode.state.offchainVotes = {};
      vnode.state.offchainVotes[proposal.id] = [];
      // fetch from backend, and then set
      $.get(`/api/viewOffchainVotes?thread_id=${proposal.id}` +
            (app.activeChainId() ? `&chain=${app.activeChainId()}`
             : app.activeCommunityId() ? `&community=${app.activeCommunityId()}` : ''))
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
    const canVote = app.isLoggedIn() && app.user.activeAccount && !pollingEnded &&
      !proposal.getOffchainVoteFor(app.user.activeAccount.chain.id, app.user.activeAccount.address);

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
              disabled: (pollingEnded || isSelected) ? true : false,
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
        proposal.offchainVotes.length === 0 && m('.offchain-poll-no-voters', 'Nobody has voted'),
        proposal.offchainVotes.map((vote) => m('.offchain-poll-voter', [
          m('.offchain-poll-voter-user', [
            m(User, {
              avatarSize: 16,
              popover: true,
              linkify: true,
              user: new AddressInfo(null, vote.address, vote.author_chain, null, null),
              hideIdentityIcon: true,
            }),
          ]),
          m('.offchain-poll-voter-choice', vote.option),
        ])),
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

export const ProposalHeaderThreadLinkedChainEntity: m.Component<{ proposal: OffchainThread, chainEntity }> = {
  view: (vnode) => {
    const { proposal, chainEntity } = vnode.attrs;
    const slug = chainEntityTypeToProposalSlug(chainEntity.type);
    if (!slug) return;

    return m('.ProposalHeaderThreadLinkedChainEntity', [
      link(
        'a',
        `/${proposal.chain}/proposal/${slug}/${chainEntity.typeId}`,
        [
          `${chainEntityTypeToProposalName(chainEntity.type)} #${chainEntity.typeId}`,
          chainEntity.completed === 't' ? ' (Completed) ' : ' ',
        ],
      ),
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
    if (proposal.stage === OffchainThreadStage.Discussion) return;

    return m('a.ProposalHeaderStage', {
      href: `/${proposal.chain || proposal.community}?stage=${proposal.stage}`,
      onclick: (e) => {
        e.preventDefault();
        m.route.set(`/${proposal.chain || proposal.community}?stage=${proposal.stage}`);
      },
      class: proposal.stage === OffchainThreadStage.ProposalInReview ? 'positive'
        : proposal.stage === OffchainThreadStage.Voting ? 'positive'
          : proposal.stage === OffchainThreadStage.Passed ? 'positive'
            : proposal.stage === OffchainThreadStage.Failed ? 'negative' : 'none',
    }, offchainThreadStageToLabel(proposal.stage));
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
  item: AnyProposal, getSetGlobalReplyStatus, getSetGlobalEditingStatus, parentState
}> = {
  view: (vnode) => {
    const { item, getSetGlobalEditingStatus, getSetGlobalReplyStatus, parentState } = vnode.attrs;
    if (!item) return;

    return m(MenuItem, {
      label: 'Edit title',
      class: 'edit-proposal-title',
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
    const proposalLink = `/${app.activeChainId()}/proposal/${proposal.slug}/${proposal.identifier}`
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
          app.chain.chainEntities.updateEntityTitle(proposal.uniqueIdentifier, parentState.updatedTitle).then((response) => {
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

export const ProposalSidebarPollEditorModule: m.Component<{ proposal, openPollEditor: Function }, { isOpen: boolean }> = {
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

export const ProposalSidebarStageEditorModule: m.Component<{
  proposal: OffchainThread,
  openStageEditor: Function
}, {
  isOpen: boolean
}> = {
  view: (vnode) => {
    const { proposal, openStageEditor } = vnode.attrs;

    return m('.ProposalSidebarStageEditorModule', [
      proposal.chainEntities.length > 0
        ? m('.placeholder-copy', 'Proposals for this thread:')
        : m('.placeholder-copy', app.chain ? 'Connect an on-chain proposal?' : 'Set a voting stage for this thread?'),
      proposal.chainEntities.length > 0 && m('.proposal-chain-entities', [
        proposal.chainEntities.map((chainEntity) => {
          return m(ProposalHeaderThreadLinkedChainEntity, { proposal, chainEntity });
        }),
      ]),
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
