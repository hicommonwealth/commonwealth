import m from 'mithril';
import { Button, List, ListItem } from 'construct-ui';

import app from 'state';

import { link } from 'helpers';
import {
  chainEntityTypeToProposalSlug,
  chainEntityTypeToProposalName,
} from 'identifiers';
import { OffchainThread } from 'models';
import { ILinkedThreadRelation } from 'client/scripts/models/OffchainThread';
import { SnapshotProposal } from 'client/scripts/helpers/snapshot_utils';
import LinkedThreadModal from '../../modals/linked_thread_modal';
import { slugify } from '../../../../../shared/utils';

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

export const ProposalLinkedThreadsEditorModule: m.Component<{
  proposal: OffchainThread;
  allowLinking: boolean;
}, {
  linkedThreadsFetched: boolean;
  linkedThreads: OffchainThread[];
} > = {
  view: (vnode) => {
    const { proposal, allowLinking } = vnode.attrs;
    const { linkedThreadsFetched } = vnode.state;
    if (!linkedThreadsFetched) {
      if (!proposal.linkedThreads?.length) {
        vnode.state.linkedThreads = [];
        vnode.state.linkedThreadsFetched = true;
      } else {
        app.threads
          .fetchThreadsFromId(
            proposal.linkedThreads.map(
              (relation: ILinkedThreadRelation) => relation.linked_thread
            )
          )
          .then((result) => {
            vnode.state.linkedThreads = result;
            vnode.state.linkedThreadsFetched = true;
            m.redraw();
          })
          .catch((err) => {
            console.error(err);
            vnode.state.linkedThreadsFetched = true;
          });
      }
    } else if (allowLinking || proposal.linkedThreads.length) {
      return m('.ProposalLinkedThreadsEditorModule', [
        !!vnode.state.linkedThreads?.length &&
        m(List, vnode.state.linkedThreads.map((thread) => {
            const discussionLink =
            `/${app.activeId()}/proposal/${thread.slug}/${thread.identifier}-` +
            `${slugify(thread.title)}`;
            return m(ListItem, {
              label: link(
                'a.linked-thread',
                discussionLink,
                thread.title,
              )
            });
          })
        ),
        allowLinking &&
        m(Button, {
          rounded: true,
          compact: true,
          fluid: true,
          label: proposal.linkedThreads?.length
            ? 'Linked threads'
            : 'Link threads',
          onclick: (e) => {
            e.preventDefault();
            app.modals.create({
              modal: LinkedThreadModal,
              data: { linkingThread: proposal },
            });
          },
        }),
      ]);
    }
  }
}

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
