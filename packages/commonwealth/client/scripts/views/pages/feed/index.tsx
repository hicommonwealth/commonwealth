import React from 'react';

import 'pages/feed/index.scss';

import app from 'state';
import DashboardActivityNotification from '../../../models/DashboardActivityNotification';
import Sublayout from '../../Sublayout';
import { fetchActivity } from '../user_dashboard/helpers';
import { DashboardViews } from '../user_dashboard';
import { CWText } from '../../components/component_kit/cw_text';
import ErrorPage from '../error';
import { Feed } from '../../components/feed';

const FeedPage = () => {
  const getGlobalFeed = async () => {
    try {
      const activity = await fetchActivity(DashboardViews.Global);
      const formattedData = activity.result
        .map((item) => DashboardActivityNotification.fromJSON(item))
        .filter(
          (item) =>
            JSON.parse(item.notificationData).chain_id === app.activeChainId()
        );
      return formattedData;
    } catch (err) {
      return err;
    }
  };

  const getChainEvents = async () => {
    try {
      const activity = await fetchActivity(DashboardViews.Chain);
      const formattedData = activity.result
        .map((item) => DashboardActivityNotification.fromJSON(item))
        .filter((item) => item.chain === app.activeChainId());
      return formattedData;
    } catch (err) {
      return err;
    }
  };

  const getCombinedFeed = async () => {
    return Promise.all([getGlobalFeed(), getChainEvents()])
      .then((result) => {
        return {
          result: sortFeed(result[0], result[1]),
        };
      })
      .catch((err) => {
        return err;
      });
  };

  const sortFeed = (globalFeed, chainEvents) => {
    let sortedFeed = [];
    if (globalFeed?.length > 0 && chainEvents?.length > 0) {
      sortedFeed = globalFeed.concat(chainEvents).sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    } else if (globalFeed?.length > 0) {
      sortedFeed = globalFeed;
    } else if (chainEvents?.length > 0) {
      sortedFeed = chainEvents;
    }
    return sortedFeed;
  };

  if (!app.chain.meta.hasHomepage) {
    return (
      <ErrorPage message="The Homepage feature has not been enabled for this community." />
    );
  }

  return (
    <Sublayout>
      <div className="FeedPage">
        <CWText type="h3" fontWeight="semiBold">
          Home
        </CWText>
        <Feed fetchData={getCombinedFeed} noFeedMessage="No activity yet" />
      </div>
    </Sublayout>
  );
};

export default FeedPage;
