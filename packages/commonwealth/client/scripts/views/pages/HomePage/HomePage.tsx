import { ContentType } from '@hicommonwealth/shared';
import { useFetchGlobalActivityQuery } from 'client/scripts/state/api/feeds/fetchUserActivity';
import { findDenominationString } from 'helpers/findDenomination';
import { useFlag } from 'hooks/useFlag';
import React, { useRef, useState } from 'react';
import { useManageCommunityStakeModalStore } from 'state/ui/modals';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { StickCommentProvider } from 'views/components/StickEditorContainer/context/StickCommentProvider';
import { WithDefaultStickyComment } from 'views/components/StickEditorContainer/context/WithDefaultStickyComment';
import { StickyEditorContainer } from 'views/components/StickEditorContainer/StickyEditorContainer';
import { PageNotFound } from 'views/pages/404';
import { CWText } from '../../components/component_kit/cw_text';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import ManageCommunityStakeModal from '../../modals/ManageCommunityStakeModal/ManageCommunityStakeModal';
import IdeaLaunchpad from '../Communities/IdeaLaunchpad';
import { TrendingCommunitiesPreview } from '../user_dashboard/TrendingCommunitiesPreview/TrendingCommunitiesPreview';
import ActiveContestList from './ActiveContestList/ActiveContestList';
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

  if (!homePageEnabled) {
    return <PageNotFound />;
  }

  return (
    <StickCommentProvider mode="community">
      <CWPageLayout ref={containerRef} className="CommunitiesPageLayout">
        <div className="HomePage">
          <WithDefaultStickyComment>
            <StickyEditorContainer
              parentType={ContentType.Thread}
              handleSubmitComment={async () => 0}
            />
          </WithDefaultStickyComment>
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
          </div>
          <TrendingTokensList />
          <TrendingCommunitiesPreview />
          <ActiveContestList />
          <XpQuestList />
          <TrendingThreadList query={useFetchGlobalActivityQuery} />
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
    </StickCommentProvider>
  );
};

export default HomePage;
