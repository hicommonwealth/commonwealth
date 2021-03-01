import m from 'mithril';
import moment from 'moment';
import app from 'state';

import { Button, Icon, Icons, Tag, MenuItem, Input } from 'construct-ui';

import {
  pluralize, link, externalLink, isSameAccount, extractDomain,
  offchainThreadStageToLabel, offchainThreadStageToIndex,
} from 'helpers';
import { proposalSlugToFriendlyName, chainEntityTypeToProposalSlug, chainEntityTypeToProposalName } from 'identifiers';

import {
  OffchainThread,
  OffchainThreadKind,
  OffchainThreadStage,
  OffchainComment,
  Proposal,
  AnyProposal,
  Account,
  Profile,
  ChainBase,
} from 'models';
import { NotificationCategories } from 'types';

import { confirmationModalWithText } from 'views/modals/confirm_modal';
import User from 'views/components/widgets/user';
import { getStatusClass, getStatusText, getSupportText } from 'views/components/proposal_row';
import VersionHistoryModal from 'views/modals/version_history_modal';
import jumpHighlightComment from 'views/pages/view_proposal/jump_to_comment';
import { GlobalStatus } from './body';

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

export const ProposalHeaderBlockExplorerLink: m.Component<{ proposal: AnyProposal | OffchainThread }> = {
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

export const ProposalHeaderVotingInterfaceLink: m.Component<{ proposal: AnyProposal | OffchainThread }> = {
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

export const ProposalHeaderThreadLinkedChainEntity: m.Component<{ proposal: OffchainThread, chainEntity }> = {
  view: (vnode) => {
    const { proposal, chainEntity } = vnode.attrs;
    const slug = chainEntityTypeToProposalSlug(chainEntity.type);
    if (!slug) return;

    return m('.ProposalHeaderThreadLinkedChainEntity', [
      link(
        'a',
        `/${proposal.chain}/proposal/${slug}/${chainEntity.type_id}`,
        [
          `${chainEntityTypeToProposalName(chainEntity.type)} #${chainEntity.type_id}`,
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
        intent: proposal.stage === OffchainThreadStage.Discussion ? 'none'
          : proposal.stage === OffchainThreadStage.ProposalInReview ? 'positive'
            : proposal.stage === OffchainThreadStage.Voting ? 'positive'
              : proposal.stage === OffchainThreadStage.Passed ? 'positive'
                : proposal.stage === OffchainThreadStage.Failed ? 'negative'
                  : proposal.stage === OffchainThreadStage.Abandoned ? 'negative' : 'none',
      }),
    ]);
  }
};

export const ProposalHeaderStageEditorButton: m.Component<{ openStageEditor: Function }, { isOpen: boolean }> = {
  view: (vnode) => {
    const { openStageEditor } = vnode.attrs;
    return m(Button, {
      class: 'ProposalHeaderStageEditorButton',
      rounded: true,
      size: 'xs',
      label: 'Select stage',
      onclick: (e) => {
        e.preventDefault();
        openStageEditor();
      },
    });
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

export const ProposalTitleEditor: m.Component<{ item: OffchainThread | AnyProposal, parentState }> = {
  oninit: (vnode) => {
    vnode.attrs.parentState.updatedTitle = vnode.attrs.item.title;
  },
  view: (vnode) => {
    const { item, parentState } = vnode.attrs;
    if (!item) return;
    const isThread = item instanceof OffchainThread;
    const body = item instanceof OffchainComment
      ? item.text
      : (item instanceof OffchainThread
        ? item.body
        : null);
    if (!body) return;

    return m(Input, {
      size: 'lg',
      name: 'edit-thread-title',
      autocomplete: 'off',
      oninput: (e) => {
        const { value } = (e as any).target;
        parentState.updatedTitle = value;
      },
      defaultValue: parentState.updatedTitle,
      tabindex: 1,
    });
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
