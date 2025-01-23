import {
  useFetchGlobalActivityQuery,
  useFetchUserActivityQuery,
} from 'client/scripts/state/api/feeds/fetchUserActivity';
import { notifyInfo } from 'controllers/app/notifications';
import { useBrowserAnalyticsTrack } from 'hooks/useBrowserAnalyticsTrack';
import useBrowserWindow from 'hooks/useBrowserWindow';
import { useFlag } from 'hooks/useFlag';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import useUserStore from 'state/ui/user';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import {
  MixpanelPWAEvent,
  MixpanelPageViewEvent,
} from '../../../../../shared/analytics/types';
import useAppStatus from '../../../hooks/useAppStatus';
import LaunchTokenCard from '../../components/LaunchTokenCard';
import { UserTrainingSlider } from '../../components/UserTrainingSlider';
import { CWText } from '../../components/component_kit/cw_text';
import {
  CWTab,
  CWTabsRow,
} from '../../components/component_kit/new_designs/CWTabs';
import { Feed } from '../../components/feed';
import { TrendingCommunitiesPreview } from './TrendingCommunitiesPreview';
import './index.scss';

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
  const location = useLocation();

  const [activePage, setActivePage] = React.useState<DashboardViews>(
    DashboardViews.Global,
  );

  const { isAddedToHomeScreen } = useAppStatus();

  const launchpadEnabled = useFlag('launchpad');

  useBrowserAnalyticsTrack({
    payload: {
      event: MixpanelPageViewEvent.DASHBOARD_VIEW,
      isPWA: isAddedToHomeScreen,
    },
  });
  const navigate = useCommonNavigate();
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
    const searchParams = new URLSearchParams(location.search);
    const existingParams = searchParams.toString();
    const additionalParams = existingParams ? `?${existingParams}` : '';

    if (!type) {
      navigate(
        `/dashboard/${user.isLoggedIn ? 'for-you' : 'global'}${additionalParams}`,
      );
    } else if (type === 'for-you' && !user.isLoggedIn) {
      navigate(`/dashboard/global${additionalParams}`);
    }
  }, [user.isLoggedIn, navigate, type, location.search]);

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
      <UserTrainingSlider />
      <div key={`${user.isLoggedIn}`}>
        <CWText type="h2" fontWeight="medium" className="page-header">
          Home
        </CWText>
        <div className="contentContainer">
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
            {activePage === DashboardViews.Global ? (
              <Feed
                query={useFetchGlobalActivityQuery}
                // @ts-expect-error <StrictNullChecks/>
                customScrollParent={containerRef.current}
              />
            ) : (
              <Feed
                query={useFetchUserActivityQuery}
                // @ts-expect-error <StrictNullChecks/>
                customScrollParent={containerRef.current}
              />
            )}
          </div>
          {isWindowExtraSmall ? (
            <>
              {launchpadEnabled && <LaunchTokenCard />}
              <TrendingCommunitiesPreview />
            </>
          ) : (
            <div className="featured-cards">
              {launchpadEnabled && <LaunchTokenCard />}
              <TrendingCommunitiesPreview />
            </div>
          )}
        </div>
      </div>
    </CWPageLayout>
  );
};

export default UserDashboard;
