/* @jsx m */

import ClassComponent from 'class_component';
import $ from 'jquery';
import _ from 'lodash';
import m from 'mithril';
import moment from 'moment';

import 'pages/stats.scss';

import app from 'state';
import ErrorPage from 'views/pages/error';
import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/sublayout';
import { BreadcrumbsTitleTag } from '../components/breadcrumbs_title_tag';
import { CWText } from '../components/component_kit/cw_text';

class StatsPage extends ClassComponent {
  private data: any;
  private batchedData: any;
  private totalData: any;
  private error: string;
  private requested: boolean;

  view() {
    if (!this.requested && app.user && app.activeChainId()) {
      this.requested = true;

      $.get(`${app.serverUrl()}/communityStats`, {
        chain: app.activeChainId(),
        jwt: app.user?.jwt,
      })
        .then(({ status, result }) => {
          if (status !== 'Success') {
            this.error = 'Error loading stats';
          } else {
            this.totalData = {
              totalComments: +result.totalComments[0].new_items,
              totalRoles: +result.totalRoles[0].new_items,
              totalThreads: +result.totalThreads[0].new_items,
            };

            const { comments, roles, threads, activeAccounts } = result;
            const batchedComments = {};
            const batchedRoles = {};
            const batchedThreads = {};
            const batchedActiveAccounts = {};
            const c = comments.map((a) => Number(a.new_items));
            const r = roles.map((a) => Number(a.new_items));
            const t = threads.map((a) => Number(a.new_items));
            const aa = activeAccounts.map((a) => Number(a.new_items));

            // Comments
            batchedComments['day'] = c.slice(0, 1).reduce((a, b) => a + b, 0);;
            batchedComments['week'] = c.slice(0, 7).reduce((a, b) => a + b, 0);
            batchedComments['2week'] = c.slice(0, 14).reduce((a, b) => a + b, 0);
            batchedComments['month'] = c.slice(0, 28).reduce((a, b) => a + b, 0);

            // Roles
            batchedRoles['day'] = r.slice(0, 1).reduce((a, b) => a + b, 0);;
            batchedRoles['week'] = r.slice(0, 7).reduce((a, b) => a + b, 0);
            batchedRoles['2week'] = r.slice(0, 14).reduce((a, b) => a + b, 0);
            batchedRoles['month'] = r.slice(0, 28).reduce((a, b) => a + b, 0);

            // Threads
            batchedThreads['day'] = t.slice(0, 1).reduce((a, b) => a + b, 0);;
            batchedThreads['week'] = t.slice(0, 7).reduce((a, b) => a + b, 0);
            batchedThreads['2week'] = t.slice(0, 14).reduce((a, b) => a + b, 0);
            batchedThreads['month'] = t.slice(0, 28).reduce((a, b) => a + b, 0);

            // Active Accounts
            batchedActiveAccounts['day'] = aa.slice(0, 1).reduce((a, b) => a + b, 0);;
            batchedActiveAccounts['week'] = aa.slice(0, 7).reduce((a, b) => a + b, 0);
            batchedActiveAccounts['2week'] = aa.slice(0, 14).reduce((a, b) => a + b, 0);
            batchedActiveAccounts['month'] = aa.slice(0, 28).reduce((a, b) => a + b, 0);

            this.batchedData = { batchedRoles, batchedComments, batchedThreads, batchedActiveAccounts };
            console.log(batchedRoles, batchedThreads, batchedComments, batchedActiveAccounts)


            const data = {};
            result.comments.forEach(({ date, new_items }) => {
              if (data[date]) {
                data[date].comments = new_items;
              } else {
                data[date] = { comments: new_items };
              }
            });

            result.roles.forEach(({ date, new_items }) => {
              if (data[date]) {
                data[date].roles = new_items;
              } else {
                data[date] = { roles: new_items };
              }
            });

            result.threads.forEach(({ date, new_items }) => {
              if (data[date]) {
                data[date].threads = new_items;
              } else {
                data[date] = { threads: new_items };
              }
            });

            (result.activeAccounts || []).forEach(({ date, new_items }) => {
              if (data[date]) {
                data[date].activeAccounts = new_items;
              } else {
                data[date] = { activeAccounts: new_items };
              }
            });

            this.data = data;
          }
          m.redraw();
        })
        .catch((error: any) => {
          console.log(error)
          if (error.responseJSON?.error) {
            this.error = error.responseJSON.error;
          } else if (error.responseText) {
            this.error = error.responseText;
          } else {
            this.error = 'Error loading analytics';
          }
          m.redraw();
        });
    }

    if (!this.requested || (!this.error && !this.data))
      return (
        <PageLoading
          message="Loading analytics"
          // title={<BreadcrumbsTitleTag title="Analytics" />}
        />
      );

    if (this.error)
      return (
        <ErrorPage
          message={this.error}
          title={<BreadcrumbsTitleTag title="Analytics" />}
        />
      );

    const { batchedRoles, batchedComments, batchedThreads, batchedActiveAccounts } = this.batchedData;
    return (
      <Sublayout
      // title={<BreadcrumbsTitleTag title="Analytics" />}
      >
        <div class="StatsPage">
          <div class="stat-row">
            <CWText fontWeight="medium"></CWText>
            <CWText fontWeight="medium">New Addresses</CWText>
            <CWText fontWeight="medium">New Comments</CWText>
            <CWText fontWeight="medium">New Threads</CWText>
            <CWText fontWeight="medium">Active Addresses</CWText>
          </div>
          <div class="stat-row">
            <CWText fontWeight="medium">24 hours</CWText>
            <CWText fontWeight="medium">{batchedRoles['day']}</CWText>
            <CWText fontWeight="medium">{batchedComments['day']}</CWText>
            <CWText fontWeight="medium">{batchedThreads['day']}</CWText>
            <CWText fontWeight="medium">{batchedActiveAccounts['day']}</CWText>
          </div>
          <div class="stat-row">
            <CWText fontWeight="medium">1 week</CWText>
            <CWText fontWeight="medium">{batchedRoles['week']}</CWText>
            <CWText fontWeight="medium">{batchedComments['week']}</CWText>
            <CWText fontWeight="medium">{batchedThreads['week']}</CWText>
            <CWText fontWeight="medium">{batchedActiveAccounts['week']}</CWText>
          </div>
          <div class="stat-row">
            <CWText fontWeight="medium">2 weeks</CWText>
            <CWText fontWeight="medium">{batchedRoles['2week']}</CWText>
            <CWText fontWeight="medium">{batchedComments['2week']}</CWText>
            <CWText fontWeight="medium">{batchedThreads['2week']}</CWText>
            <CWText fontWeight="medium">{batchedActiveAccounts['2week']}</CWText>
          </div>
          <div class="stat-row">
            <CWText fontWeight="medium">1 month</CWText>
            <CWText fontWeight="medium">{batchedRoles['month']}</CWText>
            <CWText fontWeight="medium">{batchedComments['month']}</CWText>
            <CWText fontWeight="medium">{batchedThreads['month']}</CWText>
            <CWText fontWeight="medium">{batchedActiveAccounts['month']}</CWText>
          </div>
          {/* {_.orderBy(Object.entries(this.data), (o) => o[0])
            .reverse()
            .map(([date, row]: [any, any]) => (
              <div class="stat-row">
                <CWText>{moment(date).format('l')}</CWText>
                <CWText>{row.roles || 0}</CWText>
                <CWText>{row.comments || 0}</CWText>
                <CWText>{row.threads || 0}</CWText>
                <CWText>{row.activeAccounts}</CWText>
              </div>
            ))} */}

          <div class="stat-row">
            <CWText fontWeight="medium">Total Addresses</CWText>
            <CWText fontWeight="medium">Total Comments</CWText>
            <CWText fontWeight="medium">Total Threads</CWText>
          </div>
          <div class="stat-row">
            <CWText>{this.totalData.totalRoles}</CWText>
            <CWText>{this.totalData.totalComments}</CWText>
            <CWText>{this.totalData.totalThreads}</CWText>
          </div>
        </div>
      </Sublayout>
    );
  }
}

export default StatsPage;
