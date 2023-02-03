/* @jsx jsx */
import React from 'react';

import { ClassComponent, setRoute, redraw, jsx } from 'mithrilInterop';
import type { ResultNode } from 'mithrilInterop';
import _ from 'lodash';
import { notifyInfo } from 'controllers/app/notifications';
import $ from 'jquery';
import { DashboardActivityNotification } from 'models';

import 'pages/user_dashboard/index.scss';

import app, { LoginState } from 'state';
import Sublayout from 'views/sublayout';
import { CWSpinner } from '../../components/component_kit/cw_spinner';
import { CWTab, CWTabBar } from '../../components/component_kit/cw_tabs';
import { CWText } from '../../components/component_kit/cw_text';
import { DashboardCommunitiesPreview } from './dashboard_communities_preview';
import { fetchActivity, notificationsRemaining } from './helpers';
import { UserDashboardRow } from './user_dashboard_row';

export enum DashboardViews {
  ForYou = 'For You',
  Global = 'Global',
  Chain = 'Chain',
}

type UserDashboardAttrs = {
  type?: string;
};

class UserDashboard extends ClassComponent<UserDashboardAttrs> {
  private activePage: DashboardViews;
  private chainEventCount: number;
  private chainEvents: DashboardActivityNotification[];
  private fyCount: number;
  private fyNotifications: DashboardActivityNotification[];
  private globalCount: number;
  private globalNotifications: DashboardActivityNotification[];
  private loadingData: boolean;
  private onScroll;

  // Helper to load activity conditional on the selected tab
  handleToggle = () => {
    this.loadingData = false;
    redraw();
    const tab = this.activePage;
    if (tab === DashboardViews.ForYou) {
      if (this.fyNotifications && this.fyNotifications.length === 0) this.loadingData = true;
      fetchActivity(tab).then((activity) => {
        this.fyNotifications = activity.result.map((notification) =>
          DashboardActivityNotification.fromJSON(notification)
        );
        this.loadingData = false;
        redraw();
      });
    } else if (tab === DashboardViews.Global) {
      if (this.globalNotifications && this.globalNotifications.length === 0)
        this.loadingData = true;
      fetchActivity(tab).then((activity) => {
        this.globalNotifications = activity.result.map((notification) =>
          DashboardActivityNotification.fromJSON(notification)
        );
        this.loadingData = false;
        redraw();
      });
    } else if (tab === DashboardViews.Chain) {
      if (this.chainEvents && this.chainEvents.length === 0) this.loadingData = true;
      fetchActivity(tab).then((activity) => {
        this.chainEvents = activity.result.map((notification) =>
          DashboardActivityNotification.fromJSON(notification)
        );
        this.loadingData = false;
        redraw();
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

  view(vnode: ResultNode<UserDashboardAttrs>) {
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
      setRoute(`/dashboard/${loggedIn ? 'for-you' : 'global'}`);
    } else if (vnode.attrs.type === 'for-you' && !loggedIn) {
      setRoute('/dashboard/global');
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
    this.onScroll = _.debounce(async () => {
      if (this.activePage === DashboardViews.ForYou) {
        if (!notificationsRemaining(fyNotifications.length, this.fyCount))
          return;
        const scrollHeight = $(document).height();
        const scrollPos = $(window).height() + $(window).scrollTop();
        if (scrollPos > scrollHeight - 400) {
          this.fyCount += 10;
          redraw();
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
          redraw();
        }
      } else {
        if (!notificationsRemaining(chainEvents.length, this.chainEventCount))
          return;
        const scrollHeight = $(document).height();
        const scrollPos = $(window).height() + $(window).scrollTop();
        if (scrollPos > scrollHeight - 400) {
          this.chainEventCount += 10;
          redraw();
        }
      }
    }, 400);

    return (
      <Sublayout onScroll={this.onScroll}>
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
                    setRoute('/dashboard/for-you');
                    redraw();
                  }}
                />
                <CWTab
                  label={DashboardViews.Global}
                  isSelected={activePage === DashboardViews.Global}
                  onClick={() => {
                    setRoute('/dashboard/global');
                    redraw();
                  }}
                />
                <CWTab
                  label={DashboardViews.Chain}
                  isSelected={activePage === DashboardViews.Chain}
                  onClick={() => {
                    setRoute('/dashboard/chain-events');
                    redraw();
                  }}
                />
              </CWTabBar>
            </div>
            {loadingData && <CWSpinner />}
            {!loadingData && (
              <React.Fragment>
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
                  <React.Fragment>
                    {fyNotifications && fyNotifications.length > 0 ? (
                      <React.Fragment>
                        {fyNotifications
                          .slice(0, this.fyCount)
                          .map((data, i) => (
                            <UserDashboardRow key={i} notification={data} />
                          ))}
                        {notificationsRemaining(
                          fyNotifications.length,
                          this.fyCount
                        ) && <CWSpinner />}
                      </React.Fragment>
                    ) : (
                      <CWText>Join some communities to see Activity!</CWText>
                    )}
                  </React.Fragment>
                )}
                {activePage === DashboardViews.Global && [
                  globalNotifications && globalNotifications.length > 0 ? (
                    <React.Fragment>
                      {globalNotifications
                        .slice(0, this.globalCount)
                        .map((data, i) => (
                          <UserDashboardRow key={i} notification={data} />
                        ))}
                      {notificationsRemaining(
                        globalNotifications.length,
                        this.globalCount
                      ) && <CWSpinner />}
                    </React.Fragment>
                  ) : (
                    <CWText>No Activity</CWText>
                  ),
                ]}
                {activePage === DashboardViews.Chain && (
                  <React.Fragment>
                    {chainEvents && chainEvents.length > 0 ? (
                      <React.Fragment>
                        {chainEvents
                          .slice(0, this.chainEventCount)
                          .map((data, i) => {
                            return (
                              <UserDashboardRow key={i} notification={data} />
                            );
                          })}
                        {notificationsRemaining(
                          chainEvents.length,
                          this.chainEventCount
                        ) && <CWSpinner />}
                      </React.Fragment>
                    ) : (
                      <CWText>
                        Join some communities that have governance to see Chain
                        Events!
                      </CWText>
                    )}
                  </React.Fragment>
                )}
              </React.Fragment>
            )}
          </div>
          <DashboardCommunitiesPreview />
        </div>
      </Sublayout>
    );
  }
}

export default UserDashboard;
