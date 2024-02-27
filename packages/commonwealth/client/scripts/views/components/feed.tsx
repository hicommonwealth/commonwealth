import React, { useCallback, useEffect, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';

import 'components/feed.scss';

import type DashboardActivityNotification from '../../models/DashboardActivityNotification';

import { PageNotFound } from '../pages/404';
import { UserDashboardRow } from '../pages/user_dashboard/user_dashboard_row';

import { Label as ChainEventLabel, IEventLabel } from 'chain/labelers/util';
import useUserLoggedIn from 'hooks/useUserLoggedIn';

type FeedProps = {
  fetchData: () => Promise<any>;
  noFeedMessage: string;
  defaultCount?: number;
  onFetchedDataCallback?: (data: any) => DashboardActivityNotification;
  customScrollParent?: HTMLElement;
  isChainEventsRow?: boolean;
};

const DEFAULT_COUNT = 10;

export const Feed = ({
  defaultCount,
  fetchData,
  noFeedMessage,
  onFetchedDataCallback,
  customScrollParent,
  isChainEventsRow,
}: FeedProps) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [data, setData] = useState<DashboardActivityNotification[]>();
  const [labels, setLabels] = useState<(IEventLabel | undefined)[]>();
  const [currentCount, setCurrentCount] = useState<number>(
    defaultCount || DEFAULT_COUNT,
  );
  const { isLoggedIn } = useUserLoggedIn();

  const loadMore = useCallback(() => {
    return setTimeout(() => {
      setCurrentCount(
        (prevState) => prevState + (defaultCount || DEFAULT_COUNT),
      );
    }, 500);
  }, [setCurrentCount, defaultCount]);

  useEffect(() => {
    const getData = async () => {
      try {
        const response = await fetchData();
        const notifications = onFetchedDataCallback
          ? response.result.map((activity) => onFetchedDataCallback(activity))
          : response.result;

        const filteredNotifs: DashboardActivityNotification[] = [];
        const labelsArr: (IEventLabel | undefined)[] = [];

        for (const notif of notifications) {
          if (notif.categoryId === 'chain-event') {
            try {
              const chainEvent = {
                network: notif.eventNetwork,
                data: notif.eventData,
              };
              const label = ChainEventLabel(notif.chain, chainEvent);
              filteredNotifs.push(notif);
              labelsArr.push(label);
            } catch (e) {
              console.warn(e);
            }
          } else {
            filteredNotifs.push(notif);
            labelsArr.push(undefined);
          }
        }

        setData(filteredNotifs);
        setLabels(labelsArr);
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
        <Virtuoso
          customScrollParent={customScrollParent}
          totalCount={4}
          style={{ height: '100%' }}
          itemContent={(i) => (
            <UserDashboardRow
              key={i}
              isChainEventsRow={isChainEventsRow}
              showSkeleton
            />
          )}
        />
      </div>
    );
  }

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
          return (
            <UserDashboardRow
              key={i}
              notification={data[i]}
              label={labels[i]}
              isLoggedIn={isLoggedIn}
            />
          );
        }}
      />
    </div>
  );
};
