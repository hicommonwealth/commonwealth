import * as schemas from '@hicommonwealth/schemas';
import { useFetchCommunityStatsQuery } from 'client/scripts/state/api/communities/fetchCommunityStats';
import Permissions from 'client/scripts/utils/Permissions';
import React from 'react';
import useUserStore from 'state/ui/user';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import ErrorPage from 'views/pages/error';
import { PageLoading } from 'views/pages/loading';
import z from 'zod';
import { CWText } from '../components/component_kit/cw_text';
import { PageNotFound } from './404';
import './stats.scss';

type Batch = {
  day: number;
  month: number;
  twoWeek: number;
  week: number;
};

type Batches = {
  batchedRoles: Batch;
  batchedComments: Batch;
  batchedThreads: Batch;
  batchedActiveAccounts: Batch;
};

const toBatches = ({
  active_accounts,
  comments,
  roles,
  threads,
}: z.infer<
  (typeof schemas.GetCommunityStats)['output']
>['batches']): Batches => {
  const batchedComments = {};
  const batchedRoles = {};
  const batchedThreads = {};
  const batchedActiveAccounts = {};
  const c = comments.map((a) => Number(a.new_items));
  const r = roles.map((a) => Number(a.new_items));
  const t = threads.map((a) => Number(a.new_items));
  const aa = active_accounts.map((a) => Number(a.new_items));

  // Comments
  batchedComments['day'] = c.slice(0, 1).reduce((a, b) => a + b, 0);
  batchedComments['week'] = c.slice(0, 7).reduce((a, b) => a + b, 0);
  batchedComments['twoWeek'] = c.slice(0, 14).reduce((a, b) => a + b, 0);
  batchedComments['month'] = c.slice(0, 28).reduce((a, b) => a + b, 0);

  // Roles
  batchedRoles['day'] = r.slice(0, 1).reduce((a, b) => a + b, 0);
  batchedRoles['week'] = r.slice(0, 7).reduce((a, b) => a + b, 0);
  batchedRoles['twoWeek'] = r.slice(0, 14).reduce((a, b) => a + b, 0);
  batchedRoles['month'] = r.slice(0, 28).reduce((a, b) => a + b, 0);

  // Threads
  batchedThreads['day'] = t.slice(0, 1).reduce((a, b) => a + b, 0);
  batchedThreads['week'] = t.slice(0, 7).reduce((a, b) => a + b, 0);
  batchedThreads['twoWeek'] = t.slice(0, 14).reduce((a, b) => a + b, 0);
  batchedThreads['month'] = t.slice(0, 28).reduce((a, b) => a + b, 0);

  // Active Accounts
  batchedActiveAccounts['day'] = aa.slice(0, 1).reduce((a, b) => a + b, 0);
  batchedActiveAccounts['week'] = aa.slice(0, 7).reduce((a, b) => a + b, 0);
  batchedActiveAccounts['twoWeek'] = aa.slice(0, 14).reduce((a, b) => a + b, 0);
  batchedActiveAccounts['month'] = aa.slice(0, 28).reduce((a, b) => a + b, 0);

  return {
    batchedRoles,
    batchedComments,
    batchedThreads,
    batchedActiveAccounts,
  } as Batches;
};

const StatsPage = () => {
  const user = useUserStore();
  const { data, isLoading, error } = useFetchCommunityStatsQuery(
    user?.activeCommunity?.id,
  );

  if (
    !user.isLoggedIn ||
    !(Permissions.isSiteAdmin() || Permissions.isCommunityAdmin())
  ) {
    return <PageNotFound />;
  }

  if (isLoading) {
    return <PageLoading message="Loading analytics" />;
  } else if (error) {
    return <ErrorPage message={error.message} />;
  } else if (data) {
    const batches = toBatches(data.batches);
    return (
      <CWPageLayout>
        <div className="StatsPage">
          <div className="header">
            <CWText type="h2" fontWeight="medium">
              Analytics
            </CWText>
          </div>
          <div className="stat-row dark top">
            <CWText fontWeight="medium">Duration</CWText>
            <CWText fontWeight="medium">New Addresses</CWText>
            <CWText fontWeight="medium">New Comments</CWText>
            <CWText fontWeight="medium">New Threads</CWText>
            <CWText fontWeight="medium">Active Addresses</CWText>
          </div>
          <div className="stat-row">
            <CWText>24 hours</CWText>
            <CWText>{batches.batchedRoles['day']}</CWText>
            <CWText>{batches.batchedComments['day']}</CWText>
            <CWText>{batches.batchedThreads['day']}</CWText>
            <CWText>{batches.batchedActiveAccounts['day']}</CWText>
          </div>
          <div className="stat-row">
            <CWText>1 week</CWText>
            <CWText>{batches.batchedRoles['week']}</CWText>
            <CWText>{batches.batchedComments['week']}</CWText>
            <CWText>{batches.batchedThreads['week']}</CWText>
            <CWText>{batches.batchedActiveAccounts['week']}</CWText>
          </div>
          <div className="stat-row">
            <CWText>2 weeks</CWText>
            <CWText>{batches.batchedRoles['twoWeek']}</CWText>
            <CWText>{batches.batchedComments['twoWeek']}</CWText>
            <CWText>{batches.batchedThreads['twoWeek']}</CWText>
            <CWText>{batches.batchedActiveAccounts['twoWeek']}</CWText>
          </div>
          <div className="stat-row">
            <CWText>1 month</CWText>
            <CWText>{batches.batchedRoles['month']}</CWText>
            <CWText>{batches.batchedComments['month']}</CWText>
            <CWText>{batches.batchedThreads['month']}</CWText>
            <CWText>{batches.batchedActiveAccounts['month']}</CWText>
          </div>
          <div className="stat-row dark bottom">
            <CWText fontWeight="medium">Total &#40;all time&#41;</CWText>
            <CWText fontWeight="medium">{data.totals.total_roles}</CWText>
            <CWText fontWeight="medium">{data.totals.total_comments}</CWText>
            <CWText fontWeight="medium">{data.totals.total_threads}</CWText>
          </div>
        </div>
      </CWPageLayout>
    );
  }
};

export default StatsPage;
