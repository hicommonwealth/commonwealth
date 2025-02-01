import { useFetchGlobalActivityQuery } from 'client/scripts/state/api/feeds/fetchUserActivity';
import { findDenominationString } from 'helpers/findDenomination';
import { useFlag } from 'hooks/useFlag';
import React, { useRef, useState } from 'react';
import { useManageCommunityStakeModalStore } from 'state/ui/modals';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { CWText } from '../../components/component_kit/cw_text';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import ManageCommunityStakeModal from '../../modals/ManageCommunityStakeModal/ManageCommunityStakeModal';
import IdeaLaunchpad from '../Communities/IdeaLaunchpad';
import './HomePage.scss';
import TrendingThreadList from './TrendingThreadList/TrendingThreadList';
import TrendingTokensList from './TrendingTokenList/TrendingTokenList';
import XpQuestList from './XpQuestList/XpQuestList';

const HomePage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const homePageEnabled = useFlag('homePage');

  const {
    setModeOfManageCommunityStakeModal,
    modeOfManageCommunityStakeModal,
  } = useManageCommunityStakeModalStore();

  const [selectedCommunityId] = useState<string>();

  return (
    <CWPageLayout ref={containerRef} className="CommunitiesPageLayout">
      <div className="HomePage">
        <div className="header-section">
          <div className="description">
            <CWText
              type="h1"
              {...(homePageEnabled && { fontWeight: 'semiBold' })}
            >
              Home
            </CWText>
          </div>
          <IdeaLaunchpad />
          <TrendingTokensList />
          <XpQuestList />
          <TrendingThreadList query={useFetchGlobalActivityQuery} />
        </div>
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

export default HomePage;
