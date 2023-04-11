import React, { useEffect, useState } from 'react';

import type { SnapshotProposal, SnapshotSpace } from 'helpers/snapshot_utils';
import { loadMultipleSpacesData } from 'helpers/snapshot_utils';
import {
  chainEntityTypeToProposalName,
  chainEntityTypeToProposalSlug,
  getProposalUrlPath,
} from 'identifiers';
import type { ChainEntity, Thread, ThreadStage } from 'models';

import 'pages/view_thread/linked_proposals_card.scss';

import app from 'state';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWContentPageCard } from '../../components/component_kit/cw_content_page';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import { CWText } from '../../components/component_kit/cw_text';
import { UpdateProposalStatusModal } from '../../modals/update_proposal_status_modal';
import { Modal } from '../../components/component_kit/cw_modal';

type LinkedProposalProps = {
  chainEntity: ChainEntity;
  thread: Thread;
};

const LinkedProposal = (props: LinkedProposalProps) => {
  const { thread, chainEntity } = props;

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
};

type LinkedProposalsCardProps = {
  onChangeHandler: (
    stage: ThreadStage,
    chainEntities: Array<ChainEntity>,
    snapshotProposal: Array<SnapshotProposal>
  ) => void;
  showAddProposalButton: boolean;
  thread: Thread;
};

export const LinkedProposalsCard = ({
  onChangeHandler,
  thread,
  showAddProposalButton,
}: LinkedProposalsCardProps) => {
  const [snapshot, setSnapshot] = useState<SnapshotProposal>(null);
  const [snapshotProposalsLoaded, setSnapshotProposalsLoaded] = useState(false);
  const [space, setSpace] = useState<SnapshotSpace>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (thread.snapshotProposal?.length > 0) {
      loadMultipleSpacesData(app.chain.meta.snapshot).then((data) => {
        for (const { space: _space, proposals } of data) {
          const matchingSnapshot = proposals.find(
            (sn) => sn.id === thread.snapshotProposal
          );

          if (matchingSnapshot) {
            setSnapshot(matchingSnapshot);
            setSpace(_space);
            break;
          }
        }

        setSnapshotProposalsLoaded(true);
      });
    }
  }, [thread.snapshotProposal]);

  let snapshotUrl = '';

  if (space && snapshot) {
    snapshotUrl = `${app.isCustomDomain() ? '' : `/${thread.chain}`}/snapshot/${
      space.id
    }/${snapshot.id}`;
  }

  const showSnapshot =
    thread.snapshotProposal?.length > 0 && snapshotProposalsLoaded;

  return (
    <>
      <CWContentPageCard
        header="Linked Proposals"
        content={
          thread.snapshotProposal?.length > 0 && !snapshotProposalsLoaded ? (
            <div className="spinner-container">
              <CWSpinner size="medium" />
            </div>
          ) : (
            <div className="LinkedProposalsCard">
              {thread.chainEntities.length > 0 || showSnapshot ? (
                <div className="links-container">
                  {thread.chainEntities.length > 0 && (
                    <div className="linked-proposals">
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
                    <a href={snapshotUrl}>Snapshot: {snapshot?.title}</a>
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
                  onClick={(e) => {
                    e.preventDefault();
                    setIsModalOpen(true);
                  }}
                />
              )}
            </div>
          )
        }
      />
      <Modal
        className="LinkedProposalsCardModal"
        content={
          <UpdateProposalStatusModal
            onChangeHandler={onChangeHandler}
            thread={thread}
            onModalClose={() => setIsModalOpen(false)}
          />
        }
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
    </>
  );
};
