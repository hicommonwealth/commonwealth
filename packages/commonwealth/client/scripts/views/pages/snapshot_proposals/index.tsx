import React, { useMemo, useState } from 'react';

import { NotificationCategories } from '@hicommonwealth/shared';
import type { SnapshotProposal } from 'helpers/snapshot_utils';
import { useFlag } from 'hooks/useFlag';
import moment from 'moment';
import 'pages/snapshot_proposals.scss';
import app from 'state';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import useManageDocumentTitle from '../../../hooks/useManageDocumentTitle';
import useNecessaryEffect from '../../../hooks/useNecessaryEffect';
import { CardsCollection } from '../../components/cards_collection';
import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/new_designs/CWButton';
import {
  CWTab,
  CWTabsRow,
} from '../../components/component_kit/new_designs/CWTabs';
import { SnapshotProposalCard } from './SnapshotProposalCard';

type SnapshotProposalsPageProps = {
  topic?: string;
  snapshotId: string;
};

const SnapshotProposalsPage = ({ snapshotId }: SnapshotProposalsPageProps) => {
  const [activeTab, setActiveTab] = useState<number>(1);
  const [isSnapshotProposalsLoading, setIsSnapshotProposalsLoading] =
    useState<boolean>(true);
  const [proposals, setProposals] = useState<{
    active: Array<SnapshotProposal>;
    ended: Array<SnapshotProposal>;
  }>({ active: [], ended: [] });

  const knockInAppNotifications = useFlag('knockInAppNotifications');

  const proposalsToDisplay =
    activeTab === 1 ? proposals.active : proposals.ended;

  const spaceSubscription = useMemo(
    () =>
      app.user.notifications.findNotificationSubscription({
        categoryId: NotificationCategories.SnapshotProposal,
        options: { snapshotId },
      }),
    [snapshotId],
  );

  const [hasSubscription, setHasSubscription] = useState<boolean>(
    spaceSubscription !== undefined,
  );

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

  const updateSubscription = () => {
    if (hasSubscription) {
      app.user.notifications.deleteSubscription(spaceSubscription).then(() => {
        setHasSubscription(false);
      });
    } else {
      app.user.notifications
        .subscribe({
          categoryId: NotificationCategories.SnapshotProposal,
          options: { snapshotId },
        })
        .then(() => {
          setHasSubscription(true);
        });
    }
  };

  return (
    <CWPageLayout>
      <div className="SnapshotProposalsPage">
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
          {!knockInAppNotifications && (
            <div>
              <CWButton
                label={
                  hasSubscription
                    ? 'Remove Subscription'
                    : 'Subscribe to Notifications'
                }
                iconLeft={hasSubscription ? 'mute' : 'bell'}
                onClick={updateSubscription}
                buttonHeight="sm"
              />
            </div>
          )}
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

export default SnapshotProposalsPage;
