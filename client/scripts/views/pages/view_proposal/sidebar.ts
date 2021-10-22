import m from 'mithril';
import { Button } from 'construct-ui';

import app from 'state';

import { link } from 'helpers';
import {
  chainEntityTypeToProposalSlug,
  chainEntityTypeToProposalName,
} from 'identifiers';
import { OffchainThread } from 'models';
import { SnapshotProposal } from 'client/scripts/helpers/snapshot_utils';
import LinkThreadToThreadModal from '../../modals/link_thread_to_thread_modal';

export const ProposalSidebarLinkedChainEntity: m.Component<{
  proposal: OffchainThread;
  chainEntity;
}> = {
  view: (vnode) => {
    const { proposal, chainEntity } = vnode.attrs;
    const slug = chainEntityTypeToProposalSlug(chainEntity.type);
    if (!slug) return;

    const proposalLink = `${
      app.isCustomDomain() ? '' : `/${proposal.chain}`
    }/proposal/${slug}/${chainEntity.typeId}`;

    return m('.ProposalSidebarLinkedChainEntity', [
      link('a', proposalLink, [
        `${chainEntityTypeToProposalName(chainEntity.type)} #${
          chainEntity.typeId
        }`,
        chainEntity.completed === 't' ? ' (Completed) ' : ' ',
      ]),
    ]);
  },
};

export const ProposalSidebarLinkedSnapshot: m.Component<
  {
    proposal: OffchainThread;
  },
  {
    initialized: boolean;
    snapshotProposalsLoaded: boolean;
    snapshot: SnapshotProposal;
  }
> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal.snapshotProposal) return;
    if (!app.chain?.meta.chain.snapshot) return;

    if (!vnode.state.initialized) {
      vnode.state.initialized = true;
      app.snapshot.init(app.chain.meta.chain.snapshot).then(() => {
        // refreshing loads the latest snapshot proposals into app.snapshot.proposals array
        vnode.state.snapshot = app.snapshot.proposals.find(
          (sn) => sn.id === proposal.snapshotProposal
        );
        vnode.state.snapshotProposalsLoaded = true;
        m.redraw();
      });
    }

    const proposalLink = `${
      app.isCustomDomain() ? '' : `/${proposal.chain}`
    }/snapshot/${app.chain?.meta.chain.snapshot}/${proposal.snapshotProposal}`;

    return m(
      '.ProposalSidebarLinkedSnapshot',
      !vnode.state.snapshotProposalsLoaded
        ? [
            link('a', proposalLink, [
              `Snapshot: ${proposal.snapshotProposal.slice(0, 10)} ...`,
            ]),
          ]
        : [
            link('a', proposalLink, [
              `Snapshot: ${vnode.state.snapshot.title.slice(0, 20)} ...`,
            ]),
          ]
    );
  },
};

export const ProposalSidebarLinkedThreads: m.Component<
  {
    proposal: OffchainThread;
  },
  {
    initialized: boolean;
    threadsLoaded: boolean;
    linkedThreads: OffchainThread[];
  }
> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;
    if (!proposal.linkedThreads?.length) return;

    if (!vnode.state.initialized) {
      vnode.state.initialized = true;
      app.threads
        .fetchThreadsFromId(
          proposal.linkedThreads.map((th) => th.linked_thread)
        )
        .then((result) => {
          vnode.state.threadsLoaded = true;
          vnode.state.linkedThreads = result;
        });
    }

    return m(
      '.ProposalSidebarLinkedThreads',
      !vnode.state.threadsLoaded
        ? vnode.state.linkedThreads.map((thread) => {
            const proposalLink = `${
              app.isCustomDomain() ? '' : `/${proposal.chain}`
            }/proposal/discussion/${thread.id}`;
            return link('a', proposalLink, thread.title);
          })
        : proposal.linkedThreads.map((thread) => {
            const proposalLink = `${
              app.isCustomDomain() ? '' : `/${proposal.chain}`
            }/proposal/discussion/${thread.linked_thread}`;
            return link('a', proposalLink, 'Loading...');
          })
    );
  },
};

export const ProposalSidebarPollEditorModule: m.Component<
  {
    proposal;
    openPollEditor: Function;
  },
  {
    isOpen: boolean;
  }
> = {
  view: (vnode) => {
    const { proposal, openPollEditor } = vnode.attrs;
    return m('.ProposalSidebarPollEditorModule', [
      m('.placeholder-copy', 'Add an offchain poll to this thread?'),
      m(Button, {
        rounded: true,
        compact: true,
        fluid: true,
        disabled: !!proposal.offchainVotingEndsAt,
        label: proposal.offchainVotingEndsAt
          ? 'Polling enabled'
          : 'Create a poll',
        onclick: (e) => {
          e.preventDefault();
          openPollEditor();
        },
      }),
    ]);
  },
};

export const ProposalSidebarLinkedViewer: m.Component<{
  proposal: OffchainThread;
}> = {
  view: (vnode) => {
    const { proposal } = vnode.attrs;

    return m('.ProposalSidebarLinkedViewer', [
      proposal.chainEntities.length > 0 || proposal.snapshotProposal?.length > 0
        ? m('.placeholder-copy', 'Proposals for this thread:')
        : m(
            '.placeholder-copy',
            app.chain
              ? 'Connect an on-chain proposal?'
              : 'Track the progress of this thread?'
          ),
      proposal.chainEntities.length > 0 &&
        m('.proposal-chain-entities', [
          proposal.chainEntities.map((chainEntity) => {
            return m(ProposalSidebarLinkedChainEntity, {
              proposal,
              chainEntity,
            });
          }),
        ]),
      proposal.snapshotProposal?.length > 0 &&
        m(ProposalSidebarLinkedSnapshot, { proposal }),
      proposal.linkedThreads?.length > 0
        ? m('.placeholder-copy', 'Linked threads:')
        : m('.placeholder-copy', 'Link offchain threads?'),
      proposal.linkedThreads?.length > 0 &&
        m(ProposalSidebarLinkedThreads, { proposal }),
    ]);
  },
};

export const ProposalSidebarLinkedThreadsEditorModule: m.Component<
{
  linkingThread: OffchainThread;
},
{
  isOpen: boolean;
}
> = {
view: (vnode) => {
  const { linkingThread } = vnode.attrs;
  return m('.ProposalSidebarLinkedThreadsEditorModule', [
    m(Button, {
      rounded: true,
      compact: true,
      fluid: true,
      label: 'Link threads',
      onclick: (e) => {
        e.preventDefault();
        app.modals.create({
          modal: LinkThreadToThreadModal,
          data: { linkingThread },
        });
      },
    }),
  ]);
},
};

export const ProposalSidebarStageEditorModule: m.Component<
  {
    proposal: OffchainThread;
    openStageEditor: Function;
  },
  {
    isOpen: boolean;
  }
> = {
  view: (vnode) => {
    const { openStageEditor } = vnode.attrs;

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
      }),
    ]);
  },
};
