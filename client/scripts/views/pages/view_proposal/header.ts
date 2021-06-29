import $ from 'jquery';
import m from 'mithril';
import moment from 'moment';
import app from 'state';
import { slugify } from 'utils';

import { Button, Icon, Icons, Tag, Tooltip, MenuItem, Input } from 'construct-ui';

import {
  pluralize, link, externalLink, extractDomain,
  offchainThreadStageToLabel,
  offchainVoteToLabel,
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
  OffchainVoteOptions,
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

    const options = [
      OffchainVoteOptions.SUPPORT_2,
      OffchainVoteOptions.SUPPORT,
      OffchainVoteOptions.NEUTRAL_SUPPORT,
      OffchainVoteOptions.NEUTRAL_OPPOSE,
      OffchainVoteOptions.OPPOSE,
      OffchainVoteOptions.OPPOSE_2,
    ];

    const tooltipContent = !app.isLoggedIn() ? 'Log in to vote'
      : !app.user.activeAccount ? 'Connect an address to vote'
        : (proposal.getOffchainVoteFor(app.user.activeAccount.chain.id, app.user.activeAccount.address)) ? [
          'Click to update vote'
        ] : [
          'Click to vote as ',
          m(User, { user: app.user.activeAccount }),
        ];

    const pollingEnded = proposal.offchainVotingEndsAt?.isBefore(moment().utc());

    return m('.ProposalHeaderOffchainPoll', [
      m('.offchain-poll-header', pollingEnded ? [
        'Poll closed'
      ] : [
        'Poll open - closes in ',
        // weird hack because we overwrote the moment formatter to display "just now" for future dates
        moment().from(proposal.offchainVotingEndsAt).replace(' ago', ''),
      ]),
      m(Tooltip, {
        class: 'offchain-poll-row-tooltip',
        content: tooltipContent,
        position: 'right',
        trigger: m('.offchain-poll-row', {
          class: pollingEnded ? 'offchain-poll-ended' : '',
        }, [
          options.map((option) => {
            const hasVoted = app.user.activeAccount
              && proposal.getOffchainVoteFor(app.user.activeAccount.chain.id, app.user.activeAccount.address);
            const isSelected = hasVoted
              && proposal.getOffchainVoteFor(app.user.activeAccount.chain.id, app.user.activeAccount.address).option === option;
            return m('.offchain-poll-col', {
              style: `background: ${offchainVoteToLabel(option)}`,
              onclick: async () => {
                if (!app.isLoggedIn() || !app.user.activeAccount || isSelected) return;

                const confirmed = await confirmationModalWithText(hasVoted ? 'Update your vote?' : 'Confirm your vote?')();
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
              }
            }, [
              isSelected ? m(Icon, { name: Icons.CHECK }) : ''
            ]);
          }),
        ]),
      }),
      m('.offchain-poll-respondents', [
        proposal.offchainVotes.length > 0
          && options.map((option) => m('.offchain-poll-respondents-col', [
            proposal.offchainVotes.filter((vote) => vote.option === option).length > 0
              ? m(UserGallery, {
                avatarSize: 16,
                popover: true,
                maxUsers: 3,
                users: proposal.offchainVotes
                  .filter((vote) => vote.option === option)
                  .map((vote) => new AddressInfo(null, vote.address, vote.author_chain, null, null))
              }) : ''
          ]))
      ]),
      m('.offchain-poll-caption', [
        proposal.offchainVotes.length === 0
          ? 'No votes yet'
          : pluralize(proposal.offchainVotes.length, 'vote'),
        ' · ',
        pollingEnded
          ? 'Ended '
          : 'Voting ends ',
        proposal.offchainVotingEndsAt?.format('lll'),
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
          m(Icon, { name: Icons.EXTERNAL_LINK }),
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

    return m('.ProposalHeaderStage', [
      m(Button, {
        rounded: true,
        compact: true,
        size: 'xs',
        href: `/${proposal.chain || proposal.community}?stage=${proposal.stage}`,
        onclick: (e) => {
          e.preventDefault();
          m.route.set(`/${proposal.chain || proposal.community}?stage=${proposal.stage}`);
        },
        label: offchainThreadStageToLabel(proposal.stage),
        intent: proposal.stage === OffchainThreadStage.ProposalInReview ? 'positive'
          : proposal.stage === OffchainThreadStage.Voting ? 'positive'
            : proposal.stage === OffchainThreadStage.Passed ? 'positive'
              : proposal.stage === OffchainThreadStage.Failed ? 'negative' : 'none',
      }),
    ]);
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

export const ProposalSidebarStageEditorModule: m.Component<{ openStageEditor: Function }, { isOpen: boolean }> = {
  view: (vnode) => {
    const { openStageEditor } = vnode.attrs;
    return m('.ProposalSidebarStageEditorModule', [
      m('.placeholder-copy', 'Connect an on-chain proposal?'),
      m(Button, {
        rounded: true,
        compact: true,
        fluid: true,
        label: 'Connect a proposal',
        onclick: (e) => {
          e.preventDefault();
          openStageEditor();
        },
      })
    ]);
  }
};
