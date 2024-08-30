import moment from 'moment';
import React, { useState } from 'react';
import app from 'state';

import type { SnapshotProposal } from 'helpers/snapshot_utils';
import useManageDocumentTitle from 'hooks/useManageDocumentTitle';
import useNecessaryEffect from 'hooks/useNecessaryEffect';
import { CardsCollection } from 'views/components/cards_collection';
import { CWText } from 'views/components/component_kit/cw_text';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import {
  CWTab,
  CWTabsRow,
} from 'views/components/component_kit/new_designs/CWTabs';

import { SnapshotProposalCard } from './SnapshotProposalCard';

import './SnapshotProposals.scss';

type SnapshotProposalsProps = {
  topic?: string;
  snapshotId: string;
};

const SnapshotProposals = ({ snapshotId }: SnapshotProposalsProps) => {
  const [activeTab, setActiveTab] = useState<number>(1);
  const [isSnapshotProposalsLoading, setIsSnapshotProposalsLoading] =
    useState<boolean>(true);
  const [proposals, setProposals] = useState<{
    active: Array<SnapshotProposal>;
    ended: Array<SnapshotProposal>;
  }>({ active: [], ended: [] });

  const proposalsToDisplay =
    activeTab === 1 ? proposals.active : proposals.ended;

  useManageDocumentTitle('Snapshots');

  useNecessaryEffect(() => {
    const fetch = async () => {
      setIsSnapshotProposalsLoading(true);
      await app.snapshot.init(snapshotId);

      if (app.snapshot.initialized) {
        const tempProposals = {
          active: [],
          ended: [],
        };

        // filter active and ended proposals
        app.snapshot.proposals.filter((proposal: SnapshotProposal) =>
          moment(+proposal.end * 1000) >= moment()
            ? // @ts-expect-error <StrictNullChecks/>
              tempProposals.active.push(proposal)
            : // @ts-expect-error <StrictNullChecks/>
              tempProposals.ended.push(proposal),
        );

        setProposals(tempProposals);
        setIsSnapshotProposalsLoading(false);
      }
    };

    fetch();
  }, [snapshotId]);

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
                proposal={{} as any}
              />
            ))}
          />
        )}
      </div>
    </CWPageLayout>
  );
};

export default SnapshotProposals;
