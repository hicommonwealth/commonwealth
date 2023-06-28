import type { SnapshotProposal } from 'helpers/snapshot_utils';
import moment from 'moment';
import 'pages/snapshot_proposals.scss';
import React, { useEffect, useState } from 'react';
import app from 'state';
import { NotificationCategories } from '../../../../../../common-common/src/types';
import { CardsCollection } from '../../components/cards_collection';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWTab, CWTabBar } from '../../components/component_kit/cw_tabs';
import { CWText } from '../../components/component_kit/cw_text';
import { SnapshotProposalCard } from './snapshot_proposal_card';

type SnapshotProposalsPageProps = {
  topic?: string;
  snapshotId: string;
};

const SnapshotProposalsPage = ({ snapshotId }: SnapshotProposalsPageProps) => {
  const [currentTab, setCurrentTab] = useState<number>(1);
  const [activeProposals, setActiveProposals] = useState<
    Array<SnapshotProposal>
  >([]);
  const [endedProposals, setEndedProposals] = useState<Array<SnapshotProposal>>(
    []
  );

  const spaceSubscription = app.user.notifications.findSubscription(
    NotificationCategories.SnapshotProposal,
    {
      snapshotId,
    }
  );

  const [hasSubscription, setHasSubscription] = useState<boolean>(
    spaceSubscription !== undefined
  );

  useEffect(() => {
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
  }, [snapshotId]);

  return (
    <div className="SnapshotProposalsPage">
      <div className="top-bar">
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
        <div>
          <CWButton
            label={
              hasSubscription
                ? 'Remove Subscription'
                : 'Subscribe to Notifications'
            }
            iconLeft={hasSubscription ? 'mute' : 'bell'}
            onClick={() => {
              if (hasSubscription) {
                app.user.notifications
                  .deleteSubscription(spaceSubscription)
                  .then(() => {
                    setHasSubscription(false);
                  });
              } else {
                app.user.notifications
                  .subscribe(
                    NotificationCategories.SnapshotProposal,
                    snapshotId
                  )
                  .then(() => {
                    setHasSubscription(true);
                  });
              }
            }}
            buttonType="mini-black"
          />
        </div>
      </div>
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
  );
};

export default SnapshotProposalsPage;
