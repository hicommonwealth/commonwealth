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
import { filterLinks } from 'helpers/threads';

type LinkedProposalProps = {
  thread: Thread;
  title: string;
  ceType: ChainEntity['type'];
  ceTypeId: ChainEntity['typeId'];
  ceCompleted?: ChainEntity['completed'];
};

const LinkedProposal = ({
  thread,
  title,
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
      {`${title ?? chainEntityTypeToProposalName(ceType)} #${ceTypeId} ${
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
  const [snapshotUrl, setSnapshotUrl] = useState('');
  const [space, setSpace] = useState<SnapshotSpace>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const initialSnapshotLinks = useMemo(
    () => filterLinks(thread.links, LinkSource.Snapshot),
    [thread.links]
  );

  const initialProposalLinks = useMemo(
    () => filterLinks(thread.links, LinkSource.Proposal),
    [thread.links]
  );

  useEffect(() => {
    if (initialSnapshotLinks.length > 0) {
      const proposal = initialSnapshotLinks[0];
      loadMultipleSpacesData(app.chain.meta.snapshot).then((data) => {
        for (const { space: _space, proposals } of data) {
          const matchingSnapshot = proposals.find(
            (sn) => sn.id === proposal.identifier
          );

          if (matchingSnapshot) {
            setSnapshot(matchingSnapshot);
            setSpace(_space);
            break;
          }
        }
        if (proposal.identifier.includes('/')) {
          setSnapshotUrl(
            `${app.isCustomDomain() ? '' : `/${thread.chain}`}/snapshot/${
              proposal.identifier
            }`
          );
        } else if (space && snapshot) {
          setSnapshotUrl(
            `${app.isCustomDomain() ? '' : `/${thread.chain}`}/snapshot/${
              space.id
            }/${snapshot.id}`
          );
        }
        setSnapshotProposalsLoaded(true);
      });
    }
  }, [initialSnapshotLinks]);

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
                            title={l.title}
                            ceType={'proposal' as IChainEntityKind}
                            ceTypeId={l.identifier}
                          />
                        );
                      })}
                    </div>
                  )}
                  {showSnapshot && (
                    <a href={snapshotUrl}>
                      Snapshot:{' '}
                      {initialSnapshotLinks[0].title ?? snapshot.title}
                    </a>
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
