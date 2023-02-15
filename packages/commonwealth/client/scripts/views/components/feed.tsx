import React, { useEffect, useState } from 'react';

import 'components/feed.scss';

import app from 'state';
import { DashboardActivityNotification } from 'models';
import type { CWEvent } from 'chain-events/src';
import { Label as ChainEventLabel } from 'chain-events/src';
import { UserDashboardRow } from '../pages/user_dashboard/user_dashboard_row';
import { UserDashboardChainEventRow } from '../pages/user_dashboard/user_dashboard_chain_event_row';
import { CWSpinner } from './component_kit/cw_spinner';
import { PageNotFound } from '../pages/404';

export enum FeedType {
  Forum = 'forum',
  ChainEvents = 'chain-events',
  Combined = 'combined',
}

type FeedProps = {
  fetchData: () => Promise<any>;
  type: FeedType;
  noFeedMessage: string;
  onFetchedDataCallback?: (...data: any) => DashboardActivityNotification | DashboardActivityNotification[];
};

export const Feed = (props: FeedProps) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [data, setData] = useState<any>();
  const { fetchData, type, onFetchedDataCallback } = props;

  const formatChainEvent = (data) => {
    const {
      blockNumber,
      eventNetwork,
      chain,
    } = data;

    const chainEvent: CWEvent = {
      blockNumber,
      network: eventNetwork,
      data: data.eventData,
    };

    const label = ChainEventLabel(chain, chainEvent);

    const chainInfo = app.config.chains.getById(chain);

    return {
      blockNumber,
      chainInfo,
      label,
    }
  };

  useEffect(() => {
    const getData = async () => {
      try {
        const data = await fetchData();
        setData(data.result);
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
      {type === FeedType.Forum && (
        data.map((activity, i) => {
          const formattedActivity = onFetchedDataCallback(activity);
          return (
            <UserDashboardRow key={i} notification={formattedActivity} />
          );
        })
      )}
      {type === FeedType.ChainEvents && (
        data.map((activity, i) => {
          const formattedActivity = onFetchedDataCallback(activity);
          const { blockNumber, chainInfo, label } = formatChainEvent(formattedActivity);
          return (
            <UserDashboardChainEventRow
              key={i}
              blockNumber={blockNumber}
              chain={chainInfo}
              label={label}  
            />
          );
        })
      )}
      {type === FeedType.Combined && (
        (onFetchedDataCallback(data) as DashboardActivityNotification[]).map((activity, i) => {
          if (activity.categoryId === 'chain-event') {
            const { blockNumber, chainInfo, label } = formatChainEvent(activity);
            return (
              <UserDashboardChainEventRow
                key={i}
                blockNumber={blockNumber}
                chain={chainInfo}
                label={label}
              />
            );
          } else {
            return (
              <UserDashboardRow key={i} notification={activity} />
            );
          }
        })
      )}
    </div>
  );
};
