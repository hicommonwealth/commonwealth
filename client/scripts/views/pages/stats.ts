import m from 'mithril';
import $ from 'jquery';
import _ from 'lodash';
import { Table } from 'construct-ui';

import app from 'state';
import Sublayout from 'views/sublayout';

const StatsTable: m.Component<{ data }, {}> = {
  view: (vnode) => {
    const { data } = vnode.attrs;

    const style = 'color: #999;'; // light text style
    return m(Table, {
      class: 'StatsTable',
      style: 'margin: 30px 0 50px;',
    }, [
      m('tr', [
        m('th', ''),
        m('th', { colspan: 2 }, 'New Addresses'),
        m('th', { colspan: 2 }, 'New Comments'),
        m('th', { colspan: 2 }, 'New Threads'),
        m('th', 'Active Addresses'),
        // m('th', 'Most Active'),
      ]),
      _.orderBy(Object.entries(data), (o) => o[0]).reverse().map(([date, row]: [any, any]) => m('tr', [
        m('td', date),
        m('td', row.comments || '0'),
        m('td', { style }, row.totalComments && `${row.totalComments}`),
        m('td', row.roles || '0'),
        m('td', { style }, row.totalRoles && `${row.totalRoles}`),
        m('td', row.threads || '0'),
        m('td', { style }, row.totalThreads && `${row.totalThreads}`),
        m('td', row.activeAccounts),
        // m('td', row.topTopic),
      ])),
    ]);
  }
};

const StatsPage: m.Component<{}, { requested: boolean, error: string, data }> = {
  view: (vnode) => {
    if (!vnode.state.requested && app.user && app.activeId()) {
      vnode.state.requested = true;

      $.get(`${app.serverUrl()}/communityStats`, {
        chain: app.activeChainId(),
        community: app.activeCommunityId(),
        jwt: app.user?.jwt,
      }).then(({ status, result }) => {
        // vnode.state.data = result;
        if (status !== 'Success') {
          vnode.state.error = 'Error loading stats';
        } else {
          const data = {};
          const totalComments = +result.totalComments[0].new_items;
          const totalRoles = +result.totalRoles[0].new_items;
          const totalThreads = +result.totalThreads[0].new_items;

          let acc1 = totalComments, acc2 = totalRoles, acc3 = totalThreads;
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

          vnode.state.data = data;
        }
        m.redraw();
      }).catch((error: any) => {
        if (error.responseJSON?.error) {
          vnode.state.error = error.responseJSON.error;
        } else if (error.responseText) {
          vnode.state.error = error.responseText;
        } else {
          vnode.state.error = 'Error loading stats';
        }
        m.redraw();
      });
    }

    return m(Sublayout, {
      class: 'StatsPage',
      title: 'Community Stats',
    }, [
      vnode.state.error
        ? m('.error', vnode.state.error)
        : vnode.state.data
          ? m('.stats-data', [
            m(StatsTable, { data: vnode.state.data }),
          ]) : vnode.state.requested ? m('.loading', 'Loading...') : 'Not available'
    ]);
  }
};

export default StatsPage;
