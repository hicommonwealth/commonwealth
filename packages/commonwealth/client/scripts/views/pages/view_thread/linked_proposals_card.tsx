/* @jsx m */

import m from 'mithril';

import 'pages/view_thread/linked_proposals_card.scss';

import app from 'state';
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
import { CWButton } from '../../components/component_kit/cw_button';
import { UpdateProposalStatusModal } from '../../modals/update_proposal_status_modal';
import { CWContentPageCard } from '../../components/component_kit/cw_content_page';
import { CWSpinner } from '../../components/component_kit/cw_spinner';

type LinkedProposalAttrs = {
  chainEntity: ChainEntity;
  thread: Thread;
};

class LinkedProposal implements m.ClassComponent<LinkedProposalAttrs> {
  view(vnode: m.Vnode<LinkedProposalAttrs>) {
    const { thread, chainEntity } = vnode.attrs;

    const slug = chainEntityTypeToProposalSlug(chainEntity.type);

    const threadLink = `${
      app.isCustomDomain() ? '' : `/${thread.chain}`
    }${getProposalUrlPath(slug, chainEntity.typeId, true)}`;

    return (
      <a href={threadLink}>
        {`${chainEntityTypeToProposalName(chainEntity.type)} #${
          chainEntity.typeId
        } ${chainEntity.completed ? ' (Completed)' : ''}`}
      </a>
    );
  }
}

type LinkedProposalsCardAttrs = {
  onChangeHandler: (
    stage: ThreadStage,
    chainEntities: Array<ChainEntity>,
    snapshotProposal: Array<SnapshotProposal>
  ) => void;
  showAddProposalButton: boolean;
  thread: Thread;
};

export class LinkedProposalsCard
  implements m.ClassComponent<LinkedProposalsCardAttrs>
{
  private initialized: boolean;
  private snapshot: SnapshotProposal;
  private snapshotProposalsLoaded: boolean;
  private space: SnapshotSpace;

  view(vnode: m.Vnode<LinkedProposalsCardAttrs>) {
    const { onChangeHandler, thread, showAddProposalButton } = vnode.attrs;

    const headerText =
      thread.chainEntities.length > 0 || thread.snapshotProposal?.length > 0
        ? 'Proposals for Thread'
        : app.chain
        ? 'Connect an on-chain proposal?'
        : 'Track the progress of this thread?';

    if (!this.initialized && app.chain.meta.snapshot.length > 0) {
      this.initialized = true;

      loadMultipleSpacesData(app.chain.meta.snapshot).then((data) => {
        for (const { space, proposals } of data) {
          const matchingSnapshot = proposals.find(
            (sn) => sn.id === thread.snapshotProposal
          );

          if (matchingSnapshot) {
            this.snapshot = matchingSnapshot;
            this.space = space;
            break;
          }
        }

        this.snapshotProposalsLoaded = true;
        this.initialized = false;
        m.redraw();
      });
    }

    let snapshotUrl = '';

    if (this.space && this.snapshot) {
      snapshotUrl = `${
        app.isCustomDomain() ? '' : `/${thread.chain}`
      }/snapshot/${this.space.id}/${this.snapshot.id}`;
    }

    return (
      <CWContentPageCard
        header={headerText}
        content={
          app.chain.meta.snapshot.length > 0 &&
          !this.snapshotProposalsLoaded ? (
            <div class="spinner-container">
              <CWSpinner size="medium" />
            </div>
          ) : (
            <div class="LinkedProposalsCard">
              <div class="links-container">
                {thread.chainEntities.length > 0 && (
                  <div class="linked-proposals">
                    {thread.chainEntities.map((chainEntity) => {
                      return (
                        <LinkedProposal
                          thread={thread}
                          chainEntity={chainEntity}
                        />
                      );
                    })}
                  </div>
                )}
                {this.snapshotProposalsLoaded && (
                  <a href={snapshotUrl}>Snapshot: {this.snapshot?.title}</a>
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
            </div>
          )
        }
      />
    );
  }
}
