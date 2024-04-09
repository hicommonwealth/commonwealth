import axios from 'axios';
import useNecessaryEffect from 'hooks/useNecessaryEffect';
import 'pages/stats.scss';
import React, { useState } from 'react';
import app from 'state';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import ErrorPage from 'views/pages/error';
import { PageLoading } from 'views/pages/loading';
import { CWText } from '../components/component_kit/cw_text';

type Batchable = {
  date: string;
  new_items: string;
};

type Batchables = {
  activeAccounts: Array<Batchable>;
  comments: Array<Batchable>;
  roles: Array<Batchable>;
  threads: Array<Batchable>;
};

type TotalDataType = {
  totalComments: number;
  totalRoles: number;
  totalThreads: number;
};

type Batched = {
  day: number;
  month: number;
  twoWeek: number;
  week: number;
};

type BatchedDataType = {
  batchedActiveAccounts: Batched;
  batchedComments: Batched;
  batchedRoles: Batched;
  batchedThreads: Batched;
};

const getBatched = ({
  activeAccounts,
  comments,
  roles,
  threads,
}: Batchables) => {
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
  } as BatchedDataType;
};

const StatsPage = () => {
  const [batchedData, setBatchedData] = useState<BatchedDataType>();
  const [totalData, setTotalData] = useState<TotalDataType>();
  const [error, setError] = useState('');

  useNecessaryEffect(() => {
    const fetch = async () => {
      try {
        const response = await axios.get(`${app.serverUrl()}/communityStats`, {
          params: {
            chain: app.activeChainId(),
            jwt: app.user?.jwt,
          },
        });

        const {
          comments,
          roles,
          threads,
          activeAccounts,
          totalComments,
          totalRoles,
          totalThreads,
        } = response.data.result;

        setTotalData({
          totalComments: +totalComments[0].new_items,
          totalRoles: +totalRoles[0].new_items,
          totalThreads: +totalThreads[0].new_items,
        });

        setBatchedData(
          getBatched({
            comments,
            roles,
            threads,
            activeAccounts,
          }),
        );
      } catch (err) {
        if (err.response.data.error || err.responseJSON?.error) {
          setError(err.response.data.error);
        } else if (err.response.data.error || err.responseText) {
          setError(err.response.data.error || err.responseText);
        } else {
          setError('Error loading analytics');
        }
      }
    };

    if (app.user && app.activeChainId()) {
      fetch();
    }
  }, []);

  if (!batchedData) {
    return <PageLoading message="Loading analytics" />;
  } else if (error) {
    return <ErrorPage message={error} />;
  }

  const {
    batchedRoles,
    batchedComments,
    batchedThreads,
    batchedActiveAccounts,
  } = batchedData;

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
          <CWText>{batchedRoles['twoWeek']}</CWText>
          <CWText>{batchedComments['twoWeek']}</CWText>
          <CWText>{batchedThreads['twoWeek']}</CWText>
          <CWText>{batchedActiveAccounts['twoWeek']}</CWText>
        </div>
        <div className="stat-row">
          <CWText>1 month</CWText>
          <CWText>{batchedRoles['month']}</CWText>
          <CWText>{batchedComments['month']}</CWText>
          <CWText>{batchedThreads['month']}</CWText>
          <CWText>{batchedActiveAccounts['month']}</CWText>
        </div>
        <div className="stat-row dark bottom">
          <CWText fontWeight="medium">Total &#40;all time&#41;</CWText>
          <CWText fontWeight="medium">{totalData.totalRoles}</CWText>
          <CWText fontWeight="medium">{totalData.totalComments}</CWText>
          <CWText fontWeight="medium">{totalData.totalThreads}</CWText>
        </div>
      </div>
    </CWPageLayout>
  );
};

export default StatsPage;
