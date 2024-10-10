import { loadMultipleSpacesData } from 'helpers/snapshot_utils';
import { filterLinks } from 'helpers/threads';

import { ProposalType } from '@hicommonwealth/shared';
import { getProposalUrlPath } from 'identifiers';
import { LinkSource } from 'models/Thread';
import 'pages/view_thread/linked_proposals_card.scss';
import React, { useEffect, useMemo, useState } from 'react';
import { Link as ReactRouterLink } from 'react-router-dom';
import app from 'state';
import { useFetchCustomDomainQuery } from 'state/api/configuration';
import type Thread from '../../../models/Thread';
import { CWContentPageCard } from '../../components/component_kit/CWContentPageCard';
import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from '../../components/component_kit/new_designs/CWCircleMultiplySpinner';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import { UpdateProposalStatusModal } from '../../modals/update_proposal_status_modal';

type ThreadLinkProps = {
  threadChain: string;
  identifier: string;
  isCustomDomain?: boolean;
};

const getThreadLink = ({
  threadChain,
  identifier,
  isCustomDomain,
}: ThreadLinkProps) => {
  // XXX 7/3/2024: proposal links only supported for cosmos
  const slug = ProposalType.CosmosProposal;
  const threadLink = `${
    isCustomDomain ? '' : `/${threadChain}`
  }${getProposalUrlPath(slug, identifier, true)}`;

  return threadLink;
};

type LinkedProposalsCardProps = {
  showAddProposalButton: boolean;
  thread: Thread;
};

export const LinkedProposalsCard = ({
  thread,
  showAddProposalButton,
}: LinkedProposalsCardProps) => {
  const [snapshotProposalsLoaded, setSnapshotProposalsLoaded] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState('');
  const [snapshotTitle, setSnapshotTitle] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: domain } = useFetchCustomDomainQuery();

  const initialSnapshotLinks = useMemo(
    () => filterLinks(thread.links, LinkSource.Snapshot),
    [thread.links],
  );

  const initialProposalLinks = useMemo(
    () => filterLinks(thread.links, LinkSource.Proposal),
    [thread.links],
  );

  useEffect(() => {
    if (initialSnapshotLinks.length > 0) {
      const proposal = initialSnapshotLinks[0];
      if (proposal.identifier.includes('/')) {
        setSnapshotUrl(
          `${domain?.isCustomDomain ? '' : `/${thread.communityId}`}/snapshot/${
            proposal.identifier
          }`,
        );
      } else {
        loadMultipleSpacesData(app.chain.meta?.snapshot_spaces || [])
          .then((data) => {
            for (const { space: _space, proposals } of data) {
              const matchingSnapshot = proposals.find(
                (sn) => sn.id === proposal.identifier,
              );
              if (matchingSnapshot) {
                setSnapshotTitle(matchingSnapshot.title);
                setSnapshotUrl(
                  `${
                    domain?.isCustomDomain ? '' : `/${thread.communityId}`
                  }/snapshot/${_space.id}/${matchingSnapshot.id}`,
                );
                break;
              }
            }
          })
          .catch(console.error);
      }
      setSnapshotProposalsLoaded(true);
    }
  }, [domain?.isCustomDomain, initialSnapshotLinks, thread.communityId]);

  const showSnapshot =
    initialSnapshotLinks.length > 0 && snapshotProposalsLoaded;

  return (
    <>
      <CWContentPageCard
        header="Linked Proposals"
        content={
          initialSnapshotLinks.length > 0 && !snapshotProposalsLoaded ? (
            <div className="spinner-container">
              <CWCircleMultiplySpinner />
            </div>
          ) : (
            <div className="LinkedProposalsCard">
              {initialProposalLinks.length > 0 || showSnapshot ? (
                <div className="links-container">
                  {initialProposalLinks.length > 0 && (
                    <div className="linked-proposals">
                      {initialProposalLinks.map((l) => {
                        return (
                          <ReactRouterLink
                            key={l.identifier}
                            to={getThreadLink({
                              threadChain: thread.communityId,
                              identifier: l.identifier,
                              isCustomDomain: domain?.isCustomDomain,
                            })}
                          >
                            {`${l.title ?? 'Proposal'} #${l.identifier}`}
                          </ReactRouterLink>
                        );
                      })}
                    </div>
                  )}
                  {showSnapshot &&
                    (snapshotUrl ? (
                      <ReactRouterLink to={snapshotUrl}>
                        Snapshot:{' '}
                        {initialSnapshotLinks[0].title ?? snapshotTitle}
                      </ReactRouterLink>
                    ) : (
                      <div className="snapshot-spinner-container">
                        <CWCircleMultiplySpinner />
                      </div>
                    ))}
                </div>
              ) : (
                <CWText type="b2" className="no-proposals-text">
                  There are currently no linked proposals.
                </CWText>
              )}
              {showAddProposalButton && (
                <CWButton
                  buttonHeight="sm"
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
      <CWModal
        className="LinkedProposalsCardModal"
        size="medium"
        content={
          <UpdateProposalStatusModal
            thread={thread}
            onModalClose={() => setIsModalOpen(false)}
            snapshotProposalConnected={showSnapshot}
            initialSnapshotLinks={initialSnapshotLinks}
          />
        }
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
      />
    </>
  );
};
