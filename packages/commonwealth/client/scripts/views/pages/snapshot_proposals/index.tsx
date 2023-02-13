import React from 'react';
import moment from 'moment';

import 'pages/snapshot_proposals.scss';

import app from 'state';
import Sublayout from 'views/sublayout';
import type { SnapshotProposal } from 'helpers/snapshot_utils';
import { CardsCollection } from '../../components/cards_collection';
import { CWText } from '../../components/component_kit/cw_text';
import { SnapshotProposalCard } from './snapshot_proposal_card';
import { CWTab, CWTabBar } from '../../components/component_kit/cw_tabs';
import { MixpanelSnapshotEvents } from 'analytics/types';
import { mixpanelBrowserTrack } from '../../../helpers/mixpanel_browser_util';

type SnapshotProposalsPageProps = {
  topic?: string;
  snapshotId: string;
};

const SnapshotProposalsPage = (props: SnapshotProposalsPageProps) => {
  const { snapshotId } = props;

  const [currentTab, setCurrentTab] = React.useState<number>(1);
  const [activeProposals, setActiveProposals] = React.useState<
    Array<SnapshotProposal>
  >([]);
  const [endedProposals, setEndedProposals] = React.useState<
    Array<SnapshotProposal>
  >([]);

  React.useEffect(() => {
    const fetch = async () => {
      await app.snapshot.init(snapshotId);

      if (app.snapshot.initialized) {
        setActiveProposals(
          app.snapshot.proposals.filter(
            (proposal: SnapshotProposal) =>
              moment(+proposal.end * 1000) >= moment()
          )
        );
        setEndedProposals(
          app.snapshot.proposals.filter(
            (proposal: SnapshotProposal) =>
              moment(+proposal.end * 1000) < moment()
          )
        );
      }
    };

    fetch();
  }, []);

  return (
    <Sublayout>
      <div className="SnapshotProposalsPage">
        <CWTabBar>
          <CWTab
            label="Active"
            isSelected={currentTab === 1}
            onClick={() => {
              setCurrentTab(1);
            }}
          />
          <CWTab
            label="Ended"
            isSelected={currentTab === 2}
            onClick={() => {
              setCurrentTab(2);
            }}
          />
        </CWTabBar>
        {currentTab === 1 ? (
          activeProposals.length > 0 ? (
            <CardsCollection
              content={activeProposals.map((proposal, i) => (
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
        ) : null}
        {currentTab === 2 ? (
          endedProposals.length > 0 ? (
            <CardsCollection
              content={endedProposals.map((proposal, i) => (
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
        ) : null}
      </div>
    </Sublayout>
  );
};

export default SnapshotProposalsPage;
