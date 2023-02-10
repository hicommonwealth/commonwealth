import React from 'react';

import $ from 'jquery';

import 'pages/stats.scss';

import app from 'state';
import ErrorPage from 'views/pages/error';
import { PageLoading } from 'views/pages/loading';
import Sublayout from 'views/sublayout';
import { CWText } from '../components/component_kit/cw_text';

const StatsPage = () => {
  const [data, setData] = React.useState<any>();
  const [batchedData, setBatchedData] = React.useState<any>();
  const [totalData, setTotalData] = React.useState<any>();
  const [error, setError] = React.useState<string>();
  const [requested, setRequested] = React.useState<boolean>(false);

  if (!requested && app.user && app.activeChainId()) {
    setRequested(true);

    $.get(`${app.serverUrl()}/communityStats`, {
      chain: app.activeChainId(),
      jwt: app.user?.jwt,
    })
      .then(({ status, result }) => {
        if (status !== 'Success') {
          setError('Error loading stats');
        } else {
          setTotalData({
            totalComments: +result.totalComments[0].new_items,
            totalRoles: +result.totalRoles[0].new_items,
            totalThreads: +result.totalThreads[0].new_items,
          });

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
          batchedComments['2week'] = c.slice(0, 14).reduce((a, b) => a + b, 0);
          batchedComments['month'] = c.slice(0, 28).reduce((a, b) => a + b, 0);

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

          setBatchedData({
            batchedRoles,
            batchedComments,
            batchedThreads,
            batchedActiveAccounts,
          });

          result.comments.forEach(({ date, new_items }) => {
            if (data[date]) {
              setData[date].comments = new_items;
            } else {
              setData[date] = { comments: new_items };
            }
          });

          result.roles.forEach(({ date, new_items }) => {
            if (data[date]) {
              setData[date].roles = new_items;
            } else {
              setData[date] = { roles: new_items };
            }
          });

          result.threads.forEach(({ date, new_items }) => {
            if (data[date]) {
              setData[date].threads = new_items;
            } else {
              setData[date] = { threads: new_items };
            }
          });

          (result.activeAccounts || []).forEach(({ date, new_items }) => {
            if (data[date]) {
              setData[date].activeAccounts = new_items;
            } else {
              setData[date] = { activeAccounts: new_items };
            }
          });
        }
      })
      .catch((err: any) => {
        console.log(error);
        if (err.responseJSON?.error) {
          setError(err.responseJSON.error);
        } else if (err.responseText) {
          setError(err.responseText);
        } else {
          setError('Error loading analytics');
        }
      });
  }

  if (!requested || (!error && !data))
    return <PageLoading message="Loading analytics" />;

  if (error) return <ErrorPage message={error} />;

  const {
    batchedRoles,
    batchedComments,
    batchedThreads,
    batchedActiveAccounts,
  } = batchedData;
  return (
    <Sublayout>
      <div className="StatsPage">
        <div className="stat-row">
          <CWText fontWeight="medium">Duration</CWText>
          <CWText fontWeight="medium">New Addresses</CWText>
          <CWText fontWeight="medium">New Comments</CWText>
          <CWText fontWeight="medium">New Threads</CWText>
          <CWText fontWeight="medium">Active Addresses</CWText>
        </div>
        <div className="stat-row">
          <CWText>24 hours</CWText>
          <CWText>{batchedRoles['day']}</CWText>
          <CWText>{batchedComments['day']}</CWText>
          <CWText>{batchedThreads['day']}</CWText>
          <CWText>{batchedActiveAccounts['day']}</CWText>
        </div>
        <div className="stat-row">
          <CWText>1 week</CWText>
          <CWText>{batchedRoles['week']}</CWText>
          <CWText>{batchedComments['week']}</CWText>
          <CWText>{batchedThreads['week']}</CWText>
          <CWText>{batchedActiveAccounts['week']}</CWText>
        </div>
        <div className="stat-row">
          <CWText>2 weeks</CWText>
          <CWText>{batchedRoles['2week']}</CWText>
          <CWText>{batchedComments['2week']}</CWText>
          <CWText>{batchedThreads['2week']}</CWText>
          <CWText>{batchedActiveAccounts['2week']}</CWText>
        </div>
        <div className="stat-row">
          <CWText>1 month</CWText>
          <CWText>{batchedRoles['month']}</CWText>
          <CWText>{batchedComments['month']}</CWText>
          <CWText>{batchedThreads['month']}</CWText>
          <CWText>{batchedActiveAccounts['month']}</CWText>
        </div>
        <div className="stat-row">
          <CWText fontWeight="medium">{'Total (all time)'}</CWText>
          <CWText fontWeight="medium">{totalData.totalRoles}</CWText>
          <CWText fontWeight="medium">{totalData.totalComments}</CWText>
          <CWText fontWeight="medium">{totalData.totalThreads}</CWText>
        </div>
      </div>
    </Sublayout>
  );
};

export default StatsPage;
