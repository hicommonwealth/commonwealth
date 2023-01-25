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

    return (
      <Sublayout
      // title={<BreadcrumbsTitleTag title="Analytics" />}
      >
        <div class="StatsPage">
          <div class="stat-row">
            <CWText fontWeight="medium">Date</CWText>
            <CWText fontWeight="medium">New Addresses</CWText>
            <CWText fontWeight="medium">New Comments</CWText>
            <CWText fontWeight="medium">New Threads</CWText>
            <CWText fontWeight="medium">Active Addresses</CWText>
          </div>
          {_.orderBy(Object.entries(this.data), (o) => o[0])
            .reverse()
            .map(([date, row]: [any, any]) => (
              <div class="stat-row">
                <CWText>{moment(date).format('l')}</CWText>
                <CWText>{row.roles || 0}</CWText>
                <CWText>{row.comments || 0}</CWText>
                <CWText>{row.threads || 0}</CWText>
                <CWText>{row.activeAccounts}</CWText>
              </div>
            ))}

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
