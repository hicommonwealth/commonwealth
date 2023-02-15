import React, { useCallback, useEffect, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';

import 'components/feed.scss';

import { DashboardActivityNotification } from 'models';
import { UserDashboardRow } from '../pages/user_dashboard/user_dashboard_row';
import { CWSpinner } from './component_kit/cw_spinner';
import { PageNotFound } from '../pages/404';

export enum FeedType {
  Forum = 'forum',
  ChainEvents = 'chain-events',
  Combined = 'combined',
}

type FeedProps = {
  fetchData: () => Promise<any>;
  noFeedMessage: string;
  onFetchedDataCallback?: (...data: any) => DashboardActivityNotification;
};

export const Feed = (props: FeedProps) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [data, setData] = useState<any>();
  const { fetchData, onFetchedDataCallback } = props;

  useEffect(() => {
    const getData = async () => {
      try {
        const data = await fetchData();
        let results;
        if (onFetchedDataCallback) { 
          data.result = data.result.map((activity) => {
            return onFetchedDataCallback(activity);
          });
        }
        results = data.result;
        setData(results);
      } catch (err) {
        setError(true);
      }
      setLoading(false);
    }
    
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

  return (
    <div className="Feed">
      <Virtuoso
        data={data}
        totalCount={10}
        style={{ height: '100%' }}
        itemContent={(i, item) => {
          return <UserDashboardRow key={i} notification={item} />;
        }}
      />
    </div>
  );
};
