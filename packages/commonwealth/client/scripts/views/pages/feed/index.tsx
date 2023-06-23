import 'pages/feed/index.scss';
import React, { useEffect, useState } from 'react';
import app from 'state';
import DashboardActivityNotification from '../../../models/DashboardActivityNotification';
import { CWText } from '../../components/component_kit/cw_text';
import { Feed } from '../../components/feed';
import ErrorPage from '../error';
import { DashboardViews } from '../user_dashboard';
import { fetchActivity } from '../user_dashboard/helpers';
import { DashboardCommunitiesPreview } from '../user_dashboard/dashboard_communities_preview';

const FeedPage = () => {
  const [feedData, setFeedData] = useState(null);
  const [error, setError] = useState(null);
  const [scrollElement, setScrollElement] = React.useState(null);

  useEffect(() => {
    console.log('useEffect called');
    getCombinedFeed()
      .then((result) => {
        setFeedData(result.result);
      })
      .catch((err) => {
        console.error('getCombinedFeed error:', err);
        setError(err);
      });
  }, []);

  const getGlobalFeed = async () => {
    const activity = await fetchActivity(DashboardViews.Global);
    const formattedData = activity.result
      .map((item) => DashboardActivityNotification.fromJSON(item))
      .filter(
        (item) =>
          JSON.parse(item.notificationData).chain_id === app.activeChainId()
      );
    return formattedData;
  };

  const getChainEvents = async () => {
    const activity = await fetchActivity(DashboardViews.Chain);
    const formattedData = activity.result
      .map((item) => DashboardActivityNotification.fromJSON(item))
      .filter((item) => item.chain === app.activeChainId());
    return formattedData;
  };

  const getCombinedFeed = async () => {
    const results = await Promise.all([getGlobalFeed(), getChainEvents()]);
    console.log('getCombinedFeed results:', results);
    return {
      result: sortFeed(results[0], results[1]),
    };
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

  if (error) {
    return <ErrorPage message={error.message} />;
  }

  if (!feedData) {
    return <div>Loading...</div>;
  }

  console.log('Feed data:', feedData);

  return (
    <div ref={setScrollElement} className="FeedPage">
      <div className="dashboard-column">
        <div className="dashboard-header">
          <CWText type="h3" fontWeight="semiBold">
            Home
          </CWText>
          <Feed
            fetchData={getCombinedFeed}
            noFeedMessage="No activity yet"
            customScrollParent={scrollElement}
          />
        </div>
      </div>
      <div>
        <DashboardCommunitiesPreview />
      </div>
    </div>
  );
};

export default FeedPage;
