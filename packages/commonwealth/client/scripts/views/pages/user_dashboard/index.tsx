import { notifyInfo } from 'controllers/app/notifications';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import useBrowserWindow from 'hooks/useBrowserWindow';
import { useFlag } from 'hooks/useFlag';
import useStickyHeader from 'hooks/useStickyHeader';
import { useCommonNavigate } from 'navigation/helpers';
import 'pages/user_dashboard/index.scss';
import React, { useEffect, useRef } from 'react';
import useUserStore from 'state/ui/user';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import {
  MixpanelPWAEvent,
  MixpanelPageViewEvent,
} from '../../../../../shared/analytics/types';
import useAppStatus from '../../../hooks/useAppStatus';
import LaunchTokenCard from '../../components/LaunchTokenCard';
import { CWText } from '../../components/component_kit/cw_text';
import {
  CWTab,
  CWTabsRow,
} from '../../components/component_kit/new_designs/CWTabs';
import { Feed } from '../../components/feed';
import { TrendingCommunitiesPreview } from './TrendingCommunitiesPreview';

export enum DashboardViews {
  ForYou = 'For You',
  Global = 'Global',
}

type UserDashboardProps = {
  type?: string;
};

const UserDashboard = ({ type }: UserDashboardProps) => {
  const user = useUserStore();
  const { isWindowExtraSmall } = useBrowserWindow({});
  useStickyHeader({
    elementId: 'dashboard-header',
    zIndex: 70,
    // To account for new authentication buttons, shown in small screen sizes
    top: !user.isLoggedIn ? 68 : 0,
    stickyBehaviourEnabled: isWindowExtraSmall,
  });

  const [activePage, setActivePage] = React.useState<DashboardViews>(
    DashboardViews.Global,
  );

  const { isAddedToHomeScreen } = useAppStatus();

  //this prevents rerender when user is updated
  useEffect(() => {
    if (user.isOnPWA !== isAddedToHomeScreen) {
      user.setData({ isOnPWA: isAddedToHomeScreen });
    }
  }, [isAddedToHomeScreen, user.isOnPWA, user]);

  const tokenizedCommunityEnabled = useFlag('tokenizedCommunity');

  useBrowserAnalyticsTrack({
    payload: {
      event: MixpanelPageViewEvent.DASHBOARD_VIEW,
      isPWA: isAddedToHomeScreen,
    },
  });

  const navigate = useCommonNavigate();

  const [scrollElement, setScrollElement] = React.useState(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useBrowserAnalyticsTrack({
    payload: {
      event: isAddedToHomeScreen
        ? MixpanelPWAEvent.PWA_USED
        : MixpanelPWAEvent.PWA_NOT_USED,
      isPWA: isAddedToHomeScreen,
    },
  });
  useEffect(() => {
    if (!type) {
      navigate(`/dashboard/${user.isLoggedIn ? 'for-you' : 'global'}`);
    } else if (type === 'for-you' && !user.isLoggedIn) {
      navigate('/dashboard/global');
    }
  }, [user.isLoggedIn, navigate, type]);

  const subpage: DashboardViews =
    user.isLoggedIn && type !== 'global'
      ? DashboardViews.ForYou
      : DashboardViews.Global;

  useEffect(() => {
    if (!activePage || activePage !== subpage) {
      setActivePage(subpage);
    }
  }, [activePage, subpage]);

  return (
    <CWPageLayout ref={containerRef} className="UserDashboard">
      <div key={`${user.isLoggedIn}`}>
        <CWText type="h2" fontWeight="medium" className="page-header">
          Home
        </CWText>
        {/*@ts-expect-error StrictNullChecks*/}
        <div ref={setScrollElement} className="content">
          <div className="user-dashboard-activity">
            <div className="dashboard-header" id="dashboard-header">
              <CWTabsRow>
                <CWTab
                  label={DashboardViews.ForYou}
                  isSelected={activePage === DashboardViews.ForYou}
                  onClick={() => {
                    if (!user.isLoggedIn) {
                      notifyInfo(
                        'Sign in or create an account for custom activity feed',
                      );
                      return;
                    }
                    navigate('/dashboard/for-you');
                  }}
                />
                <CWTab
                  label={DashboardViews.Global}
                  isSelected={activePage === DashboardViews.Global}
                  onClick={() => {
                    navigate('/dashboard/global');
                  }}
                />
              </CWTabsRow>
            </div>
            <>
              {activePage === DashboardViews.ForYou && (
                <Feed
                  dashboardView={DashboardViews.ForYou}
                  noFeedMessage="Join some communities to see Activity!"
                  // @ts-expect-error <StrictNullChecks/>
                  customScrollParent={scrollElement}
                />
              )}
              {activePage === DashboardViews.Global && (
                <Feed
                  dashboardView={DashboardViews.Global}
                  noFeedMessage="No Activity"
                  // @ts-expect-error <StrictNullChecks/>
                  customScrollParent={scrollElement}
                />
              )}
            </>
          </div>
          {isWindowExtraSmall ? (
            <>
              {tokenizedCommunityEnabled && <LaunchTokenCard />}
              <TrendingCommunitiesPreview />
            </>
          ) : (
            <div className="featured-cards">
              {tokenizedCommunityEnabled && <LaunchTokenCard />}
              <TrendingCommunitiesPreview />
            </div>
          )}
        </div>
      </div>
    </CWPageLayout>
  );
};

export default UserDashboard;
