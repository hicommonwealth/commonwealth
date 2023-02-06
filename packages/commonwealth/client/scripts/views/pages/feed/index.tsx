/* @jsx jsx */
import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';
import $ from 'jquery';

import 'pages/feed/index.scss';

import app from 'state';
import Sublayout from '../../sublayout';
import { PageLoading } from '../loading';
import { fetchActivity } from '../user_dashboard/helpers';
import { DashboardViews } from '../user_dashboard';
import { UserDashboardRow } from '../user_dashboard/user_dashboard_row';
import { CWText } from '../../components/component_kit/cw_text';
import ErrorPage from '../error';

class FeedPage extends ClassComponent {
  private isLoading: boolean;
  private globalFeed: any;
  private chainEvents: any;
  private error: boolean;

  private getGlobalFeed = async () => {
    try {
      const activity = await fetchActivity(DashboardViews.Global);
      this.globalFeed = activity.result
        .map((item) => {
          return {
            ...item,
            notificationData: item.notification_data,
            createdAt: JSON.parse(item.notification_data).created_at,
          };
        })
        .filter((item) => {
          return (
            JSON.parse(item.notification_data).chain_id === app.activeChainId()
          );
        });
    } catch (err) {
      this.error = true;
    }
  };

  private getChainEvents = async () => {
    try {
      const activity = await fetchActivity(DashboardViews.Chain);
      this.chainEvents = activity.result
        .map((item) => {
          return {
            blockNumber: item.block_number,
            chain: item.chain,
            eventData: item.event_data,
            eventNetwork: item.event_network,
            categoryId: 'chain-event',
            createdAt: item.created_at,
          };
        })
        .filter((item) => {
          return item.chain === app.activeChainId();
        });
    } catch (err) {
      this.error = true;
    }
  };

  oninit() {
    this.isLoading = true;
    this.getGlobalFeed();
    this.getChainEvents();
    this.isLoading = false;
  }

  view() {
    if (this.isLoading) {
      return <PageLoading />;
    }

    if (this.error) {
      return <ErrorPage message="There was an error loading the feed." />;
    }

    if (this.globalFeed?.length === 0 && this.chainEvents?.length === 0) return;

    let sortedFeed;
    if (this.globalFeed?.length > 0 && this.chainEvents?.length > 0) {
      sortedFeed = this.globalFeed.concat(this.chainEvents).sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    } else if (this.globalFeed?.length > 0) {
      sortedFeed = this.globalFeed;
    } else if (this.chainEvents?.length > 0) {
      sortedFeed = this.chainEvents;
    }

    if (sortedFeed?.length === 0) return;

    return (
      <Sublayout>
        <div className="FeedPage">
          <CWText type="h3" fontWeight="semiBold">
            Home
          </CWText>
          {sortedFeed?.length > 0 &&
            sortedFeed.map((item, i) => {
              return <UserDashboardRow key={i} notification={item} />;
            })}
        </div>
      </Sublayout>
    );
  }
}

export default FeedPage;
