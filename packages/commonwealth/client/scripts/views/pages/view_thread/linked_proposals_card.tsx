/* @jsx jsx */


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

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
import { CWText } from '../../components/component_kit/cw_text';

type LinkedProposalAttrs = {
  chainEntity: ChainEntity;
  thread: Thread;
};

class LinkedProposal extends ClassComponent<LinkedProposalAttrs> {
  view(vnode: ResultNode<LinkedProposalAttrs>) {
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

export class LinkedProposalsCard extends ClassComponent<LinkedProposalsCardAttrs> {
  private initialized: boolean;
  private snapshot: SnapshotProposal;
  private snapshotProposalsLoaded: boolean;
  private space: SnapshotSpace;

  view(vnode: ResultNode<LinkedProposalsCardAttrs>) {
    const { onChangeHandler, thread, showAddProposalButton } = vnode.attrs;

    if (!this.initialized && thread.snapshotProposal?.length > 0) {
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
        redraw();
      });
    }

    let snapshotUrl = '';

    if (this.space && this.snapshot) {
      snapshotUrl = `${
        app.isCustomDomain() ? '' : `/${thread.chain}`
      }/snapshot/${this.space.id}/${this.snapshot.id}`;
    }

    const showSnapshot =
      thread.snapshotProposal?.length > 0 && this.snapshotProposalsLoaded;

    return (
      <CWContentPageCard
        header="Linked Proposals"
        content={
          thread.snapshotProposal?.length > 0 &&
          !this.snapshotProposalsLoaded ? (
            <div class="spinner-container">
              <CWSpinner size="medium" />
            </div>
          ) : (
            <div class="LinkedProposalsCard">
              {thread.chainEntities.length > 0 || showSnapshot ? (
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
                  {showSnapshot && (
                    <a href={snapshotUrl}>Snapshot: {this.snapshot?.title}</a>
                  )}
                </div>
              ) : (
                <CWText type="b2" className="no-proposals-text">
                  There are currently no linked proposals.
                </CWText>
              )}
              {showAddProposalButton && (
                <CWButton
                  buttonType="mini-black"
                  label="Link proposal"
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
