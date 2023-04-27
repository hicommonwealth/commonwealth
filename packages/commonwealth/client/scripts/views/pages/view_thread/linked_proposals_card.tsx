import React, { useEffect, useMemo, useState } from 'react';

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
import { Link, LinkSource } from 'models/Thread';
import { IChainEntityKind } from 'chain-events/src';

type LinkedProposalProps = {
  thread: Thread;
  ceType: ChainEntity['type'];
  ceTypeId: ChainEntity['typeId'];
  ceCompleted?: ChainEntity['completed'];
};

const LinkedProposal = ({
  thread,
  ceType,
  ceTypeId,
  ceCompleted,
}: LinkedProposalProps) => {
  const slug = chainEntityTypeToProposalSlug(ceType);

  const threadLink = `${
    app.isCustomDomain() ? '' : `/${thread.chain}`
  }${getProposalUrlPath(slug, ceTypeId, true)}`;

  return (
    <a href={threadLink}>
      {`${chainEntityTypeToProposalName(ceType)} #${ceTypeId} ${
        ceCompleted ? ' (Completed)' : ''
      }`}
    </a>
  );
};

type LinkedProposalsCardProps = {
  onChangeHandler: (stage: ThreadStage, links?: Link[]) => void;
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

  const initialSnapshotLinks = useMemo(
    () => thread.links.filter((l) => l.source === LinkSource.Snapshot),
    [thread.links]
  );

  const initialProposalLinks = useMemo(
    () => thread.links.filter((l) => l.source === LinkSource.Proposal),
    [thread.links]
  );

  useEffect(() => {
    if (initialSnapshotLinks.length > 0) {
      loadMultipleSpacesData(app.chain.meta.snapshot).then((data) => {
        for (const { space: _space, proposals } of data) {
          const matchingSnapshot = proposals.find(
            (sn) => sn.id === initialSnapshotLinks[0].identifier
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
  }, [initialSnapshotLinks]);

  let snapshotUrl = '';

  if (space && snapshot) {
    snapshotUrl = `${app.isCustomDomain() ? '' : `/${thread.chain}`}/snapshot/${
      space.id
    }/${snapshot.id}`;
  }

  const showSnapshot =
    initialSnapshotLinks.length > 0 && snapshotProposalsLoaded;

  return (
    <>
      <CWContentPageCard
        header="Linked Proposals"
        content={
          initialSnapshotLinks.length > 0 && !snapshotProposalsLoaded ? (
            <div className="spinner-container">
              <CWSpinner size="medium" />
            </div>
          ) : (
            <div className="LinkedProposalsCard">
              {initialProposalLinks.length > 0 || showSnapshot ? (
                <div className="links-container">
                  {initialProposalLinks.length > 0 && (
                    <div className="linked-proposals">
                      {initialProposalLinks.map((l) => {
                        return (
                          <LinkedProposal
                            key={l.identifier}
                            thread={thread}
                            ceType={'proposal' as IChainEntityKind}
                            ceTypeId={l.identifier}
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
