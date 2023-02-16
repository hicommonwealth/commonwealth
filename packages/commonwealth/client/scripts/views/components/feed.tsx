import React, { useCallback, useEffect, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';

import 'components/feed.scss';

import { DashboardActivityNotification } from 'models';
import { UserDashboardRow } from '../pages/user_dashboard/user_dashboard_row';
import { CWSpinner } from './component_kit/cw_spinner';
import { PageNotFound } from '../pages/404';

type FeedProps = {
  fetchData: () => Promise<any>;
  noFeedMessage: string;
  defaultCount?: number;
  onFetchedDataCallback?: (data: any) => DashboardActivityNotification;
};

const DEFAULT_COUNT = 10;

export const Feed = (props: FeedProps) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [data, setData] = useState<DashboardActivityNotification[]>();
  const [currentCount, setCurrentCount] = useState<number>(
    props.defaultCount || DEFAULT_COUNT
  );
  const { fetchData, onFetchedDataCallback } = props;

  const Footer = () => {
    return (
      <div className="loading-spinner small">
        <CWSpinner />
      </div>
    );
  };

  const loadMore = useCallback(() => {
    return setTimeout(() => {
      setCurrentCount(
        (currentCount) => currentCount + (props.defaultCount || DEFAULT_COUNT)
      );
    }, 500);
  }, [setCurrentCount]);

  useEffect(() => {
    const getData = async () => {
      try {
        const data = await fetchData();
        if (onFetchedDataCallback) {
          data.result = data.result.map((activity) => {
            return onFetchedDataCallback(activity);
          });
        }
        setData(data.result);
      } catch (err) {
        setError(true);
      }
      setLoading(false);
    };

    getData();
  }, []);

  if (loading) {
    return (
      <div className="Feed">
        <div className="loading-spinner">
          <CWSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return <PageNotFound message="There was an error rendering the feed." />;
  }

  if (!data || data?.length === 0) {
    return (
      <div className="Feed">
        <div className="no-feed-message">{props.noFeedMessage}</div>
      </div>
    );
  }

  if (currentCount > data.length) setCurrentCount(data.length);

  return (
    <div className="Feed">
      <Virtuoso
        totalCount={currentCount}
        endReached={loadMore}
        style={{ height: '100%' }}
        itemContent={(i) => {
          return <UserDashboardRow key={i} notification={data[i]} />;
        }}
        components={{ Footer }}
      />
    </div>
  );
};
