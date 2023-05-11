import React, { useCallback, useEffect, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';

import 'components/feed.scss';

import type DashboardActivityNotification from '../../models/DashboardActivityNotification';

import { UserDashboardRow } from '../pages/user_dashboard/user_dashboard_row';
import { PageNotFound } from '../pages/404';
import { CWSpinner } from './component_kit/cw_spinner';

type FeedProps = {
  fetchData: () => Promise<any>;
  noFeedMessage: string;
  defaultCount?: number;
  onFetchedDataCallback?: (data: any) => DashboardActivityNotification;
  customScrollParent?: HTMLElement;
};

const DEFAULT_COUNT = 10;

export const Feed = ({
  defaultCount,
  fetchData,
  noFeedMessage,
  onFetchedDataCallback,
  customScrollParent,
}: FeedProps) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [data, setData] = useState<DashboardActivityNotification[]>();
  const [currentCount, setCurrentCount] = useState<number>(
    defaultCount || DEFAULT_COUNT
  );

  const loadMore = useCallback(() => {
    return setTimeout(() => {
      setCurrentCount(
        (prevState) => prevState + (defaultCount || DEFAULT_COUNT)
      );
    }, 500);
  }, [setCurrentCount, defaultCount]);

  useEffect(() => {
    const getData = async () => {
      try {
        const response = await fetchData();

        setData(
          onFetchedDataCallback
            ? response.result.map((activity) => onFetchedDataCallback(activity))
            : response.result
        );
      } catch (err) {
        setError(true);
      }
      setLoading(false);
    };

    getData();
  }, []);

  if (loading) return <CWSpinner />;

  if (error) {
    return <PageNotFound message="There was an error rendering the feed." />;
  }

  if (!data || data?.length === 0) {
    return (
      <div className="Feed">
        <div className="no-feed-message">{noFeedMessage}</div>
      </div>
    );
  }

  if (currentCount > data.length) setCurrentCount(data.length);

  return (
    <div className="Feed">
      <Virtuoso
        customScrollParent={customScrollParent}
        totalCount={currentCount}
        endReached={loadMore}
        style={{ height: '100%' }}
        itemContent={(i) => {
          return <UserDashboardRow key={i} notification={data[i]} />;
        }}
      />
    </div>
  );
};
