/* eslint-disable @typescript-eslint/ban-types */
import m from 'mithril';
import { Button, Tag, MenuItem, Input } from 'construct-ui';

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

import { notifySuccess } from 'controllers/app/notifications';
import { getStatusClass, getStatusText } from 'views/components/proposal_card';

import { confirmationModalWithText } from 'views/modals/confirm_modal';
import { SnapshotProposal } from 'client/scripts/helpers/snapshot_utils';
import { activeQuillEditorHasText, GlobalStatus } from './body';
import { IProposalPageState } from '.';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';

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
        href: `/${proposal.chain}?stage=${proposal.stage}`,
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
      getStatusText(proposal, true)
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
