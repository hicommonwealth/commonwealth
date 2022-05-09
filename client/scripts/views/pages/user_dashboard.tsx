/* @jsx m */

import m from 'mithril';
import _ from 'lodash';
import $ from 'jquery';
import { TabItem, Tabs, Spinner } from 'construct-ui';

import 'pages/user_dashboard.scss';

import app from 'state';
import { DashboardActivityNotification } from 'models';
import UserDashboardRow from 'views/components/user_dashboard_row';
import Sublayout from 'views/sublayout';
import DashboardExplorePreview from '../components/dashboard_explore_preview';
import { CWIcon } from '../components/component_kit/cw_icons/cw_icon';

const fetchActivity = async (request: string) => {
  const activity = await $.post(`${app.serverUrl()}/viewActivity`, {
    request,
    jwt: app.user.jwt,
  });
  return activity;
};

const notificationsRemaining = (contentLength, count) => {
  return contentLength >= 10 && count < contentLength;
};

enum DashboardViews {
  ForYou = 'For You',
  Global = 'Global',
  Chain = 'Chain',
}

export class UserDashboard implements m.ClassComponent {
  private activeTab: DashboardViews;
  private chainEventCount: number;
  private chainEvents: DashboardActivityNotification[];
  private fyCount: number;
  private fyNotifications: DashboardActivityNotification[];
  private globalCount: number;
  private globalNotifications: DashboardActivityNotification[];
  private loadingData: boolean;
  private onscroll;

  // Helper to load activity conditional on the selected tab
  handleToggle = (tab: DashboardViews) => {
    this.loadingData = false;
    if (tab === DashboardViews.ForYou) {
      if (this.fyNotifications.length === 0) this.loadingData = true;
      fetchActivity('forYou').then((activity) => {
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
      fetchActivity('global').then((activity) => {
        this.globalNotifications = activity.result.map((notification) =>
          DashboardActivityNotification.fromJSON(notification)
        );
        this.loadingData = false;
        m.redraw();
      });
    } else if (tab === DashboardViews.Chain) {
      if (this.chainEvents.length === 0) this.loadingData = true;
      fetchActivity('chainEvents').then((activity) => {
        this.chainEvents = activity.result.map((notification) =>
          DashboardActivityNotification.fromJSON(notification)
        );
        this.loadingData = false;
        m.redraw();
      });
    }
    this.activeTab = tab;
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

  view() {
    const {
      activeTab,
      fyNotifications,
      globalNotifications,
      chainEvents,
      loadingData,
    } = this;

    // Load activity
    const subpage: DashboardViews = m.route.get().includes('for-you')
      ? DashboardViews.ForYou
      : m.route.get().includes('chain-events')
      ? DashboardViews.Chain
      : m.route.get().includes('global')
      ? DashboardViews.Global
      : app.user.activeAccount
      ? DashboardViews.ForYou
      : DashboardViews.Global;
    if (!this.activeTab) {
      this.handleToggle(subpage);
    }

    // Scroll
    this.onscroll = _.debounce(async () => {
      if (this.activeTab === DashboardViews.ForYou) {
        if (!notificationsRemaining(fyNotifications.length, this.fyCount))
          return;
        const scrollHeight = $(document).height();
        const scrollPos = $(window).height() + $(window).scrollTop();
        if (scrollPos > scrollHeight - 400) {
          this.fyCount += 10;
          m.redraw();
        }
      } else if (this.activeTab === DashboardViews.Global) {
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
            <Tabs align="left" bordered={false} fluid={true}>
              <TabItem
                label={DashboardViews.ForYou}
                active={activeTab === DashboardViews.ForYou}
                onclick={() => {
                  handleToggle(DashboardViews.ForYou);
                  m.redraw();
                }}
              />
              <TabItem
                label={DashboardViews.Global}
                active={activeTab === DashboardViews.Global}
                onclick={() => {
                  handleToggle(DashboardViews.Global);
                  m.redraw();
                }}
              />
              <TabItem
                label={DashboardViews.Chain}
                active={activeTab === DashboardViews.Chain}
                onclick={() => {
                  handleToggle(DashboardViews.Chain);
                  m.redraw();
                }}
              />
            </Tabs>
            {loadingData && (
              <div class="dashboard-row-wrap">
                <div class="Spinner">
                  <Spinner active={true} />
                </div>
              </div>
            )}
            {!loadingData && (
              <div class="dashboard-row-wrap">
                {activeTab === DashboardViews.ForYou && (
                  <>
                    {fyNotifications && fyNotifications.length > 0 ? (
                      <>
                        {fyNotifications.slice(0, this.fyCount).map((data) => {
                          return m(UserDashboardRow, {
                            notification: data,
                            onListPage: true,
                          });
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
                {activeTab === DashboardViews.Global && [
                  globalNotifications && globalNotifications.length > 0 ? (
                    <>
                      {globalNotifications
                        .slice(0, this.globalCount)
                        .map((data) => {
                          return m(UserDashboardRow, {
                            notification: data,
                            onListPage: true,
                          });
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
                {activeTab === DashboardViews.Chain && (
                  <>
                    {chainEvents && chainEvents.length > 0 ? (
                      <>
                        {chainEvents
                          .slice(0, this.chainEventCount)
                          .map((data) => {
                            return m(UserDashboardRow, {
                              notification: data,
                              onListPage: true,
                            });
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
          {m(DashboardExplorePreview)}
        </div>
      </Sublayout>
    );
  }
}
