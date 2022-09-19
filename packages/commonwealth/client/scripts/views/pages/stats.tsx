/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import _ from 'lodash';
import moment from 'moment';

import 'pages/stats.scss';

import app from 'state';
import { PageLoading } from 'views/pages/loading';
import ErrorPage from 'views/pages/error';
import Sublayout from 'views/sublayout';
import { BreadcrumbsTitleTag } from '../components/breadcrumbs_title_tag';
import { CWText } from '../components/component_kit/cw_text';

class StatsPage implements m.Component {
  private data: any;
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
            const data = {};
            const totalComments = +result.totalComments[0].new_items;
            const totalRoles = +result.totalRoles[0].new_items;
            const totalThreads = +result.totalThreads[0].new_items;

            let acc1 = totalComments,
              acc2 = totalRoles,
              acc3 = totalThreads;

            result.comments.forEach(({ date, new_items }) => {
              if (data[date]) {
                data[date].comments = new_items;
                data[date].totalComments = acc1;
              } else {
                data[date] = { comments: new_items, totalComments: acc1 };
              }
              acc1 -= new_items;
            });

            result.roles.forEach(({ date, new_items }) => {
              if (data[date]) {
                data[date].roles = new_items;
                data[date].totalRoles = acc2;
              } else {
                data[date] = { roles: new_items, totalRoles: acc2 };
              }
              acc2 -= new_items;
            });

            result.threads.forEach(({ date, new_items }) => {
              if (data[date]) {
                data[date].threads = new_items;
                data[date].totalThreads = acc3;
              } else {
                data[date] = { threads: new_items, totalThreads: acc3 };
              }
              acc3 -= new_items;
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
          title={<BreadcrumbsTitleTag title="Analytics" />}
          showNewProposalButton
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
      <Sublayout title={<BreadcrumbsTitleTag title="Analytics" />}>
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
                <CWText>{row.comments || 0}</CWText>
                <CWText>{row.roles || 0}</CWText>
                <CWText>{row.threads || 0}</CWText>
                <CWText>{row.activeAccounts}</CWText>
              </div>
            ))}
        </div>
      </Sublayout>
    );
  }
}

export default StatsPage;
