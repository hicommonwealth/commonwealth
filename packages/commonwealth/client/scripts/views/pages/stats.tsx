/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import _ from 'lodash';
import { Table, Tag } from 'construct-ui';

import app from 'state';

import { PageLoading } from 'views/pages/loading';
import ErrorPage from 'views/pages/error';
import Sublayout from 'views/sublayout';

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
      return m(PageLoading, {
        message: 'Loading analytics',
        title: [
          'Analytics',
          m(Tag, {
            size: 'xs',
            label: 'Beta',
            style: 'position: relative; top: -2px; margin-left: 6px',
          }),
        ],
      });

    if (this.error)
      return m(ErrorPage, {
        message: this.error,
        title: [
          'Analytics',
          m(Tag, {
            size: 'xs',
            label: 'Beta',
            style: 'position: relative; top: -2px; margin-left: 6px',
          }),
        ],
      });

    return m(
      Sublayout,
      {
        title: [
          'Analytics',
          m(Tag, {
            size: 'xs',
            label: 'Beta',
            style: 'position: relative; top: -2px; margin-left: 6px',
          }),
        ],
      },
      [
        m('.stats-data', [
          m(
            Table,
            {
              class: 'StatsTable',
              style: 'margin: 30px 0 50px;',
            },
            [
              m('tr', [
                m('th', ''),
                m('th', { colspan: 2 }, 'New Addresses'),
                m('th', { colspan: 2 }, 'New Comments'),
                m('th', { colspan: 2 }, 'New Threads'),
                m('th', 'Active Addresses'),
              ]),
              _.orderBy(Object.entries(this.data), (o) => o[0])
                .reverse()
                .map(([date, row]: [any, any]) =>
                  m('tr', [
                    m('td', date),
                    m('td', row.comments || '0'),
                    m(
                      'td',
                      { style: 'color: #999;' },
                      row.totalComments && `${row.totalComments}`
                    ),
                    m('td', row.roles || '0'),
                    m(
                      'td',
                      { style: 'color: #999;' },
                      row.totalRoles && `${row.totalRoles}`
                    ),
                    m('td', row.threads || '0'),
                    m(
                      'td',
                      { style: 'color: #999;' },
                      row.totalThreads && `${row.totalThreads}`
                    ),
                    m('td', row.activeAccounts),
                  ])
                ),
            ]
          ),
        ]),
      ]
    );
  }
}

export default StatsPage;
