/* @jsx m */

import ClassComponent from 'class_component';
import $ from 'jquery';
import m from 'mithril';

import app from 'state';
import ErrorPage from 'views/pages/error';
import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/sublayout';
import { BreadcrumbsTitleTag } from '../components/breadcrumbs_title_tag';
import { CWText } from '../components/component_kit/cw_text';

import 'pages/stats.scss';

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
            batchedComments['day'] = c.slice(0, 1).reduce((a, b) => a + b, 0);
            batchedComments['week'] = c.slice(0, 7).reduce((a, b) => a + b, 0);
            batchedComments['2week'] = c
              .slice(0, 14)
              .reduce((a, b) => a + b, 0);
            batchedComments['month'] = c
              .slice(0, 28)
              .reduce((a, b) => a + b, 0);

            // Roles
            batchedRoles['day'] = r.slice(0, 1).reduce((a, b) => a + b, 0);
            batchedRoles['week'] = r.slice(0, 7).reduce((a, b) => a + b, 0);
            batchedRoles['2week'] = r.slice(0, 14).reduce((a, b) => a + b, 0);
            batchedRoles['month'] = r.slice(0, 28).reduce((a, b) => a + b, 0);

            // Threads
            batchedThreads['day'] = t.slice(0, 1).reduce((a, b) => a + b, 0);
            batchedThreads['week'] = t.slice(0, 7).reduce((a, b) => a + b, 0);
            batchedThreads['2week'] = t.slice(0, 14).reduce((a, b) => a + b, 0);
            batchedThreads['month'] = t.slice(0, 28).reduce((a, b) => a + b, 0);

            // Active Accounts
            batchedActiveAccounts['day'] = aa
              .slice(0, 1)
              .reduce((a, b) => a + b, 0);
            batchedActiveAccounts['week'] = aa
              .slice(0, 7)
              .reduce((a, b) => a + b, 0);
            batchedActiveAccounts['2week'] = aa
              .slice(0, 14)
              .reduce((a, b) => a + b, 0);
            batchedActiveAccounts['month'] = aa
              .slice(0, 28)
              .reduce((a, b) => a + b, 0);

            this.batchedData = {
              batchedRoles,
              batchedComments,
              batchedThreads,
              batchedActiveAccounts,
            };
            console.log(
              batchedRoles,
              batchedThreads,
              batchedComments,
              batchedActiveAccounts
            );

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

            (result.activeAddressAccounts || []).forEach(({ date, new_items }) => {
              if (data[date]) {
                data[date].activeAddressAccounts = new_items;
              } else {
                data[date] = { activeAccounts: new_items };
              }
            });

            this.data = data;
          }
          m.redraw();
        })
        .catch((error: any) => {
          console.log(error);
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

    const {
      batchedRoles,
      batchedComments,
      batchedThreads,
      batchedActiveAccounts,
    } = this.batchedData;
    return (
      <Sublayout
      // title={<BreadcrumbsTitleTag title="Analytics" />}
      >
        <div class="StatsPage">
          <div class="stat-row dark top">
            <CWText fontWeight="medium">Time period</CWText>
            <CWText fontWeight="medium">Active Addresses</CWText>
            <CWText fontWeight="medium">New Addresses</CWText>
            <CWText fontWeight="medium">New Comments</CWText>
            <CWText fontWeight="medium">New Threads</CWText>
          </div>
          <div class="stat-row">
            <CWText>24 hours</CWText>
            <CWText>{batchedActiveAccounts['day']}</CWText>
            <CWText>{batchedRoles['day']}</CWText>
            <CWText>{batchedComments['day']}</CWText>
            <CWText>{batchedThreads['day']}</CWText>
          </div>
          <div class="stat-row">
            <CWText>1 week</CWText>
            <CWText>{batchedActiveAccounts['week']}</CWText>
            <CWText>{batchedRoles['week']}</CWText>
            <CWText>{batchedComments['week']}</CWText>
            <CWText>{batchedThreads['week']}</CWText>
          </div>
          <div class="stat-row">
            <CWText>2 weeks</CWText>
            <CWText>{batchedActiveAccounts['2week']}</CWText>
            <CWText>{batchedRoles['2week']}</CWText>
            <CWText>{batchedComments['2week']}</CWText>
            <CWText>{batchedThreads['2week']}</CWText>
          </div>
          <div class="stat-row">
            <CWText>1 month</CWText>
            <CWText>{batchedActiveAccounts['month']}</CWText>
            <CWText>{batchedRoles['month']}</CWText>
            <CWText>{batchedComments['month']}</CWText>
            <CWText>{batchedThreads['month']}</CWText>
          </div>
          <div class="stat-row dark bottom">
            <CWText fontWeight="medium">{'Total (all time)'}</CWText>
            <CWText fontWeight="medium">{'N/A'}</CWText>
            <CWText fontWeight="medium">{this.totalData.totalRoles}</CWText>
            <CWText fontWeight="medium">{this.totalData.totalComments}</CWText>
            <CWText fontWeight="medium">{this.totalData.totalThreads}</CWText>
          </div>
        </div>
      </Sublayout>
    );
  }
}

export default StatsPage;
