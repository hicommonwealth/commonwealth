/* @jsx m */

import m from 'mithril';
import _ from 'lodash';
import $ from 'jquery';
import { Spinner } from 'construct-ui';

import 'pages/user_dashboard.scss';

import app, { LoginState } from 'state';
import { DashboardActivityNotification } from 'models';
import Sublayout from 'views/sublayout';
import { notifyInfo } from 'controllers/app/notifications';
import { CWIcon } from '../../components/component_kit/cw_icons/cw_icon';
import { CWTabBar, CWTab } from '../../components/component_kit/cw_tabs';
import { DashboardExplorePreview } from './dashboard_explore_preview';
import { UserDashboardRow } from './user_dashboard_row';
import { fetchActivity } from './helpers';

export enum DashboardViews {
  ForYou = 'For You',
  Global = 'Global',
  Chain = 'Chain',
}

class UserDashboard implements m.ClassComponent<{ type: string }> {
  private activePage: DashboardViews;
  private chainEventCount: number;
  private chainEvents: DashboardActivityNotification[];
  private fyCount: number;
  private fyNotifications: DashboardActivityNotification[];
  private globalCount: number;
  private globalNotifications: DashboardActivityNotification[];
  private loadingData: boolean;
  private onscroll;

  // Helper to load activity conditional on the selected tab
  handleToggle = () => {
    this.loadingData = false;
    m.redraw();
    const tab = this.activePage;
    if (tab === DashboardViews.ForYou) {
      if (this.fyNotifications.length === 0) this.loadingData = true;
      fetchActivity(tab).then((activity) => {
        this.fyNotifications = activity.result
          .map((notification) =>
            DashboardActivityNotification.fromJSON(notification)
          )
          .reverse();
        this.loadingData = false;
        m.redraw();
      });
    } else if (tab === DashboardViews.Global) {
      if (this.globalNotifications.length === 0) this.loadingData = true;
      fetchActivity(tab).then((activity) => {
        this.globalNotifications = activity.result.map((notification) =>
          DashboardActivityNotification.fromJSON(notification)
        );
        this.loadingData = false;
        m.redraw();
      });
    } else if (tab === DashboardViews.Chain) {
      if (this.chainEvents.length === 0) this.loadingData = true;
      fetchActivity(tab).then((activity) => {
        this.chainEvents = activity.result.map((notification) =>
          DashboardActivityNotification.fromJSON(notification)
        );
        this.loadingData = false;
        m.redraw();
      });
    }
    this.activePage = tab;
  };

  oninit() {
    this.fyCount = 10;
    this.globalCount = 10;
    this.chainEventCount = 10;
    this.loadingData = false;
    this.fyNotifications = [];
    this.globalNotifications = [];
    this.chainEvents = [];
  }

  view(vnode) {
    const {
      activePage,
      fyNotifications,
      globalNotifications,
      chainEvents,
      loadingData,
    } = this;
    // Load activity
    const loggedIn = app.loginState === LoginState.LoggedIn;
    if (!vnode.attrs.type) {
      m.route.set(`/dashboard/${loggedIn ? 'for-you' : 'global'}`);
    } else if (vnode.attrs.type === 'for-you' && !loggedIn) {
      m.route.set('/dashboard/global');
    }
    const subpage: DashboardViews =
      vnode.attrs.type === 'chain-events'
        ? DashboardViews.Chain
        : vnode.attrs.type === 'global'
        ? DashboardViews.Global
        : loggedIn
        ? DashboardViews.ForYou
        : DashboardViews.Global;
    if (!this.activePage || this.activePage !== subpage) {
      this.activePage = subpage;
      this.handleToggle();
    }

    // Scroll
    this.onscroll = _.debounce(async () => {
      if (this.activePage === DashboardViews.ForYou) {
        if (!notificationsRemaining(fyNotifications.length, this.fyCount))
          return;
        const scrollHeight = $(document).height();
        const scrollPos = $(window).height() + $(window).scrollTop();
        if (scrollPos > scrollHeight - 400) {
          this.fyCount += 10;
          m.redraw();
        }
      } else if (this.activePage === DashboardViews.Global) {
        if (
          !notificationsRemaining(globalNotifications.length, this.globalCount)
        )
          return;
        const scrollHeight = $(document).height();
        const scrollPos = $(window).height() + $(window).scrollTop();
        if (scrollPos > scrollHeight - 400) {
          this.globalCount += 10;
          m.redraw();
        }
      } else {
        if (!notificationsRemaining(chainEvents.length, this.chainEventCount))
          return;
        const scrollHeight = $(document).height();
        const scrollPos = $(window).height() + $(window).scrollTop();
        if (scrollPos > scrollHeight - 400) {
          this.chainEventCount += 10;
          m.redraw();
        }
      }
    }, 400);

    return (
      <Sublayout onscroll={this.onscroll}>
        <div class="UserDashboard">
          <div class="dashboard-header">
            <div class="title">
              Activity
              <div
                class="communities-link link"
                onclick={() => {
                  m.route.set('/communities');
                  m.redraw();
                }}
              >
                View more communities
                <CWIcon iconName="externalLink" iconSize="small" />
              </div>
            </div>
            <CWTabBar>
              <CWTab
                label={DashboardViews.ForYou}
                isSelected={activePage === DashboardViews.ForYou}
                onclick={() => {
                  if (!loggedIn) {
                    notifyInfo(
                      'Log in or create an account for custom activity feed'
                    );
                    return;
                  }
                  m.route.set('/dashboard/for-you');
                  m.redraw();
                }}
              />
              <CWTab
                label={DashboardViews.Global}
                isSelected={activePage === DashboardViews.Global}
                onclick={() => {
                  m.route.set('/dashboard/global');
                  m.redraw();
                }}
              />
              <CWTab
                label={DashboardViews.Chain}
                isSelected={activePage === DashboardViews.Chain}
                onclick={() => {
                  m.route.set('/dashboard/chain-events');
                  m.redraw();
                }}
              />
            </CWTabBar>
            {loadingData && (
              <div class="dashboard-row-wrap">
                <div class="Spinner">
                  <Spinner active={true} />
                </div>
              </div>
            )}
            {!loadingData && (
              <div class="dashboard-row-wrap">
                {activePage === DashboardViews.ForYou && (
                  <>
                    {fyNotifications && fyNotifications.length > 0 ? (
                      <>
                        {fyNotifications.slice(0, this.fyCount).map((data) => {
                          return (
                            <UserDashboardRow notification={data} onListPage />
                          );
                        })}
                        {notificationsRemaining(
                          fyNotifications.length,
                          this.fyCount
                        ) ? (
                          <div class="Spinner">
                            <Spinner active={true} />
                          </div>
                        ) : (
                          ''
                        )}
                      </>
                    ) : (
                      <div class="no-notifications">
                        Join some communities to see Activity!
                      </div>
                    )}
                  </>
                )}
                {activePage === DashboardViews.Global && [
                  globalNotifications && globalNotifications.length > 0 ? (
                    <>
                      {globalNotifications
                        .slice(0, this.globalCount)
                        .map((data) => {
                          <UserDashboardRow notification={data} onListPage />;
                        })}
                      {notificationsRemaining(
                        globalNotifications.length,
                        this.globalCount
                      ) ? (
                        <div class="Spinner">
                          <Spinner active={true} />
                        </div>
                      ) : (
                        ''
                      )}
                    </>
                  ) : (
                    <div class="no-notifications">No Activity</div>
                  ),
                ]}
                {activePage === DashboardViews.Chain && (
                  <>
                    {chainEvents && chainEvents.length > 0 ? (
                      <>
                        {chainEvents
                          .slice(0, this.chainEventCount)
                          .map((data) => {
                            return (
                              <UserDashboardRow
                                notification={data}
                                onListPage
                              />
                            );
                          })}
                        {notificationsRemaining(
                          chainEvents.length,
                          this.chainEventCount
                        ) ? (
                          <div class="Spinner">
                            <Spinner active={true} />
                          </div>
                        ) : (
                          ''
                        )}
                      </>
                    ) : (
                      <div class="no-notifications">
                        Join some communities that have governance to see Chain
                        Events!
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          <DashboardExplorePreview />
        </div>
      </Sublayout>
    );
  }
}

export default UserDashboard;
