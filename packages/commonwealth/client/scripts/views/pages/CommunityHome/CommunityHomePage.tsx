import app from 'client/scripts/state';
import { useFetchGlobalActivityQuery } from 'client/scripts/state/api/feeds/fetchUserActivity';
import { findDenominationString } from 'helpers/findDenomination';
import { useFlag } from 'hooks/useFlag';
import React, { useRef, useState } from 'react';
import { useManageCommunityStakeModalStore } from 'state/ui/modals';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { PageNotFound } from 'views/pages/404';
import { CWText } from '../../components/component_kit/cw_text';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import ManageCommunityStakeModal from '../../modals/ManageCommunityStakeModal/ManageCommunityStakeModal';
import ActiveContestList from '../HomePage/ActiveContestList/ActiveContestList';
import TrendingThreadList from '../HomePage/TrendingThreadList/TrendingThreadList';
import XpQuestList from '../HomePage/XpQuestList/XpQuestList';
import './CommunityHomePage.scss';
import CommunityTransactions from './CommunityTransactions/CommunityTransactions';
import TokenDetails from './TokenDetails/TokenDetails';
import TokenPerformance from './TokenPerformance/TokenPerformance';

const CommunityHome = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const communityHomeEnabled = useFlag('communityHome');
  const xpEnabled = useFlag('xp');
  const chain = app.chain.meta.id;

  const {
    setModeOfManageCommunityStakeModal,
    modeOfManageCommunityStakeModal,
  } = useManageCommunityStakeModalStore();

  const [selectedCommunityId] = useState<string>();

  if (!communityHomeEnabled) {
    return <PageNotFound />;
  }

  return (
    <CWPageLayout ref={containerRef} className="CommunitiesPageLayout">
      <div className="CommunityHome">
        <div className="header-section">
          <div className="description">
            <CWText
              type="h1"
              {...(communityHomeEnabled && { fontWeight: 'semiBold' })}
            >
              Community Home
            </CWText>
            <TokenDetails
              communityId={chain}
              communityMemberCount={app.chain.meta.profile_count || 0}
              communityThreadCount={app.chain.meta.numVotingThreads || 0}
            />
          </div>
        </div>
        <TokenPerformance />
        <ActiveContestList />
        <CommunityTransactions />
        {xpEnabled && <XpQuestList communityIdFilter={chain} />}
        <TrendingThreadList
          query={useFetchGlobalActivityQuery}
          communityIdFilter={chain}
        />
        <CWModal
          size="small"
          content={
            <ManageCommunityStakeModal
              mode={modeOfManageCommunityStakeModal}
              // @ts-expect-error <StrictNullChecks/>
              onModalClose={() => setModeOfManageCommunityStakeModal(null)}
              denomination={
                findDenominationString(selectedCommunityId || '') || 'ETH'
              }
            />
          }
          // @ts-expect-error <StrictNullChecks/>
          onClose={() => setModeOfManageCommunityStakeModal(null)}
          open={!!modeOfManageCommunityStakeModal}
        />
      </div>
    </CWPageLayout>
  );
};

export default CommunityHome;
