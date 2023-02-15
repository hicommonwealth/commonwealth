import React from 'react';
import { Virtuoso } from 'react-virtuoso';

import { notifyInfo } from 'controllers/app/notifications';
import { DashboardActivityNotification } from 'models';

import 'pages/user_dashboard/index.scss';

import app, { LoginState } from 'state';
import Sublayout from 'views/sublayout';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import { CWTab, CWTabBar } from '../../components/component_kit/cw_tabs';
import { CWText } from '../../components/component_kit/cw_text';
import { DashboardCommunitiesPreview } from './dashboard_communities_preview';
import { fetchActivity } from './helpers';
import { UserDashboardRow } from './user_dashboard_row';
import { useCommonNavigate } from 'navigation/helpers';

const DEFAULT_COUNT = 10;

export enum DashboardViews {
  ForYou = 'For You',
  Global = 'Global',
  Chain = 'Chain',
}

type UserDashboardProps = {
  type?: string;
};

const UserDashboard = (props: UserDashboardProps) => {
  const { type } = props;

  const [activePage, setActivePage] = React.useState<DashboardViews>(
    DashboardViews.Global
  );
  const [chainEvents, setChainEvents] = React.useState<
    Array<DashboardActivityNotification>
  >([]);
  const [fyNotifications, setFyNotifications] = React.useState<
    Array<DashboardActivityNotification>
  >([]);
  const [globalNotifications, setGlobalNotifications] = React.useState<
    Array<DashboardActivityNotification>
  >([]);
  const [loadingData, setLoadingData] = React.useState<boolean>(false);

  const navigate = useCommonNavigate();

  const loggedIn = app.loginState === LoginState.LoggedIn;

  if (!type) {
    navigate(`/dashboard/${loggedIn ? 'for-you' : 'global'}`);
  } else if (type === 'for-you' && !loggedIn) {
    navigate('/dashboard/global');
  }

  const subpage: DashboardViews =
    type === 'chain-events'
      ? DashboardViews.Chain
      : type === 'global'
      ? DashboardViews.Global
      : loggedIn
      ? DashboardViews.ForYou
      : DashboardViews.Global;

  React.useEffect(() => {
    const fetch = async () => {
      if (activePage === DashboardViews.ForYou) {
        if (fyNotifications.length === 0) {
          setLoadingData(true);

          const activity = await fetchActivity(activePage);

          const result = activity.result.map((notification) =>
            DashboardActivityNotification.fromJSON(notification)
          );

          setFyNotifications(result);

          setLoadingData(false);
        }
      } else if (activePage === DashboardViews.Global) {
        if (globalNotifications.length === 0) {
          setLoadingData(true);

          const activity = await fetchActivity(activePage);

          const result = activity.result.map((notification) =>
            DashboardActivityNotification.fromJSON(notification)
          );

          setGlobalNotifications(result);

          setLoadingData(false);
        }
      } else if (activePage === DashboardViews.Chain) {
        if (chainEvents.length === 0) {
          setLoadingData(true);

          const activity = await fetchActivity(activePage);

          const result = activity.result.map((notification) =>
            DashboardActivityNotification.fromJSON(notification)
          );

          setChainEvents(result);

          setLoadingData(false);
        }
      }

      if (!activePage || activePage !== subpage) {
        setActivePage(subpage);
      }
    };

    fetch();
  }, [activePage]);

  return (
    <Sublayout>
      <div className="UserDashboard">
        <div className="dashboard-column">
          <div className="dashboard-header">
            <CWText type="h3" fontWeight="medium">
              Home
            </CWText>
            <CWTabBar>
              <CWTab
                label={DashboardViews.ForYou}
                isSelected={activePage === DashboardViews.ForYou}
                onClick={() => {
                  if (!loggedIn) {
                    notifyInfo(
                      'Log in or create an account for custom activity feed'
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
              <CWTab
                label={DashboardViews.Chain}
                isSelected={activePage === DashboardViews.Chain}
                onClick={() => {
                  navigate('/dashboard/chain-events');
                }}
              />
            </CWTabBar>
          </div>
          {loadingData && <CWSpinner />}
          {!loadingData && (
            <>
              {/* TODO: add filter functionality */}
              {/* <CWPopover
                  trigger={
                    <CWButton
                      buttonType="mini-white"
                      label="Filter"
                      iconRight="chevronDown"
                    />
                  }
                  content={
                    <CWCard className="dashboard-filter-items">
                      <CWCheckbox
                        checked={false}
                        value=""
                        label="Threads"
                        onchange={() => {
                          // TODO: add filter functionality
                        }}
                      />
                      <CWCheckbox
                        checked={false}
                        value=""
                        label="Polls"
                        onchange={() => {
                          // TODO: add filter functionality
                        }}
                      />
                      <CWCheckbox
                        checked={false}
                        value=""
                        label="Proposals"
                        onchange={() => {
                          // TODO: add filter functionality
                        }}
                      />
                      <CWCheckbox
                        checked={false}
                        value=""
                        label="Crowdfunds"
                        onchange={() => {
                          // TODO: add filter functionality
                        }}
                      />
                    </CWCard>
                  }
                />
                <CWDivider /> */}
              {activePage === DashboardViews.ForYou && (
                <>
                  {fyNotifications && fyNotifications.length > 0 ? (
                    <Virtuoso
                      data={fyNotifications}
                      itemContent={(i, data) => {
                        return <UserDashboardRow key={i} notification={data} />;
                      }}
                    />
                  ) : (
                    <CWText>Join some communities to see Activity!</CWText>
                  )}
                </>
              )}
              {activePage === DashboardViews.Global && (
                <>
                  {globalNotifications && globalNotifications.length > 0 ? (
                    <Virtuoso
                      data={globalNotifications}
                      itemContent={(i, data) => {
                        return <UserDashboardRow key={i} notification={data} />;
                      }}
                    />
                  ) : (
                    <CWText>No Activity</CWText>
                  )}
                </>
              )}
              {activePage === DashboardViews.Chain && (
                <>
                  {chainEvents && chainEvents.length > 0 ? (
                    <Virtuoso
                      data={chainEvents}
                      itemContent={(i, data) => {
                        return <UserDashboardRow key={i} notification={data} />;
                      }}
                    />
                  ) : (
                    <CWText>
                      Join some communities that have governance to see Chain
                      Events!
                    </CWText>
                  )}
                </>
              )}
            </>
          )}
        </div>
        <DashboardCommunitiesPreview />
      </div>
    </Sublayout>
  );
};

export default UserDashboard;
