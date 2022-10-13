/* @jsx m */

import m from 'mithril';

import 'pages/view_proposal/linked_proposals_card.scss';

import app from 'state';
import { link } from 'helpers';
import {
  chainEntityTypeToProposalSlug,
  chainEntityTypeToProposalName,
  getProposalUrlPath,
} from 'identifiers';
import { ChainEntity, Thread, ThreadStage } from 'models';
import {
  loadMultipleSpacesData,
  SnapshotProposal,
  SnapshotSpace,
} from 'helpers/snapshot_utils';
import { CWCard } from '../../components/component_kit/cw_card';
import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/cw_button';
import { UpdateProposalStatusModal } from '../../modals/update_proposal_status_modal';

class ProposalSidebarLinkedChainEntity
  implements
    m.ClassComponent<{
      thread: Thread;
      chainEntity;
    }>
{
  view(vnode) {
    const { thread, chainEntity } = vnode.attrs;

    const slug = chainEntityTypeToProposalSlug(chainEntity.type);
    if (!slug) return;

    const threadLink = `${
      app.isCustomDomain() ? '' : `/${thread.chain}`
    }${getProposalUrlPath(slug, chainEntity.typeId, true)}`;

    return link('a', threadLink, [
      `${chainEntityTypeToProposalName(chainEntity.type)} #${
        chainEntity.typeId
      }`,
      chainEntity.completed === 't' ? ' (Completed) ' : ' ',
    ]);
  }
}

class ProposalSidebarLinkedSnapshot
  implements
    m.ClassComponent<{
      thread: Thread;
    }>
{
  private initialized: boolean;
  private snapshot: SnapshotProposal;
  private snapshotProposalsLoaded: boolean;
  private space: SnapshotSpace;

  view(vnode) {
    const { thread } = vnode.attrs;
    if (!thread.snapshotProposal) return;
    if (!app.chain?.meta?.snapshot) return;

    if (!this.initialized) {
      this.initialized = true;

      loadMultipleSpacesData(app.chain.meta.snapshot).then((data) => {
        for (const { space, proposals } of data) {
          const matching_snapshot = proposals.find(
            (sn) => sn.id === thread.snapshotProposal
          );
          if (matching_snapshot) {
            this.snapshot = matching_snapshot;
            this.space = space;
            break;
          }
        }
        this.snapshotProposalsLoaded = true;
        m.redraw();
      });
    }

    let proposalLink = '';

    if (this.space && this.snapshot) {
      proposalLink = `${
        app.isCustomDomain() ? '' : `/${thread.chain}`
      }/snapshot/${this.space.id}/${this.snapshot.id}`;
    }

    return link('a', proposalLink, [
      `Snapshot: ${
        !this.snapshotProposalsLoaded
          ? thread.snapshotProposal
          : this.snapshot?.title
      }`,
    ]);
  }
}

export class LinkedProposalsCard
  implements
    m.ClassComponent<{
      onChangeHandler: (
        stage: ThreadStage,
        chainEntities?: ChainEntity[],
        snapshotProposal?: SnapshotProposal[]
      ) => void;
      thread: Thread;
      showAddProposalButton: boolean;
    }>
{
  view(vnode) {
    const { onChangeHandler, thread, showAddProposalButton } = vnode.attrs;
    return (
      <CWCard className="LinkedProposalsCard">
        {thread.chainEntities.length > 0 ||
        thread.snapshotProposal?.length > 0 ? (
          <CWText type="h5" className="header-text">
            Proposals for Thread
          </CWText>
        ) : (
          <CWText type="h5">
            {app.chain
              ? 'Connect an on-chain proposal?'
              : 'Track the progress of this thread?'}
          </CWText>
        )}
        <div class="links-container">
          {thread.chainEntities.length > 0 && (
            <div class="proposal-chain-entities">
              {thread.chainEntities.map((chainEntity) => {
                return (
                  <ProposalSidebarLinkedChainEntity
                    thread={thread}
                    chainEntity={chainEntity}
                  />
                );
              })}
            </div>
          )}
          {thread.snapshotProposal?.length > 0 && (
            <ProposalSidebarLinkedSnapshot thread={thread} />
          )}
        </div>
        {showAddProposalButton && (
          <CWButton
            label="Connect a proposal"
            onclick={(e) => {
              e.preventDefault();
              app.modals.create({
                modal: UpdateProposalStatusModal,
                data: {
                  onChangeHandler,
                  thread,
                },
              });
            }}
          />
        )}
      </CWCard>
    );
  }
}
