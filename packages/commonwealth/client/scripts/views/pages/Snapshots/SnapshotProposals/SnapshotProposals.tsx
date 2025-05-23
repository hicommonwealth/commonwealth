import moment from 'moment';
import React, { useState } from 'react';

import useManageDocumentTitle from 'hooks/useManageDocumentTitle';
import { CardsCollection } from 'views/components/cards_collection';
import { CWText } from 'views/components/component_kit/cw_text';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import {
  CWTab,
  CWTabsRow,
} from 'views/components/component_kit/new_designs/CWTabs';

import { SnapshotProposalCard } from './SnapshotProposalCard';

import { SnapshotProposal } from 'helpers/snapshot_utils';
import { useGetSnapshotProposalsQuery } from 'state/api/snapshots';
import { PageNotFound } from '../../404';
import { isValidSnapshotName } from '../../CommunityManagement/Integrations/Snapshots/validation';
import './SnapshotProposals.scss';

type SnapshotProposalsProps = {
  topic?: string;
  snapshotId: string;
};

const SnapshotProposals = ({ snapshotId }: SnapshotProposalsProps) => {
  const isValidSnapshot = isValidSnapshotName(snapshotId);
  const [activeTab, setActiveTab] = useState<number>(1);

  const { data: snapshotProposals, isLoading: isSnapshotProposalsLoading } =
    useGetSnapshotProposalsQuery({
      space: snapshotId,
    });

  const getActiveProposals = () => {
    return (snapshotProposals || []).filter(
      (proposal) => moment(+proposal.end * 1000) >= moment(),
    );
  };

  const getEndedProposals = () => {
    return (snapshotProposals || []).filter(
      (proposal) => moment(+proposal.end * 1000) < moment(),
    );
  };

  const proposalsToDisplay =
    activeTab === 1 ? getActiveProposals() : getEndedProposals();

  useManageDocumentTitle('Snapshots');

  if (!isValidSnapshot) {
    return <PageNotFound />;
  }

  return (
    <CWPageLayout>
      <div className="SnapshotProposals">
        <CWText type="h2" fontWeight="medium" className="header">
          Snapshots
        </CWText>
        <div className="top-bar">
          <CWTabsRow>
            {['Active', 'Ended'].map((tabName, index) => (
              <CWTab
                key={index}
                label={tabName}
                isSelected={activeTab === index + 1}
                onClick={() => setActiveTab(index + 1)}
              />
            ))}
          </CWTabsRow>
        </div>
        {!isSnapshotProposalsLoading ? (
          proposalsToDisplay.length > 0 ? (
            <CardsCollection
              content={proposalsToDisplay.map((proposal, i) => (
                <SnapshotProposalCard
                  key={i}
                  snapshotId={snapshotId}
                  proposal={proposal}
                />
              ))}
            />
          ) : (
            <CWText className="no-proposals-text">
              No active proposals found.
            </CWText>
          )
        ) : (
          <CardsCollection
            content={Array.from({ length: 10 }).map((x, i) => (
              <SnapshotProposalCard
                key={i}
                snapshotId={snapshotId}
                showSkeleton
                proposal={{} as SnapshotProposal}
              />
            ))}
          />
        )}
      </div>
    </CWPageLayout>
  );
};

export default SnapshotProposals;
