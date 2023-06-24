import './index.scss';
import React, { useEffect, useState } from 'react';
import app from 'state';
import DashboardActivityNotification from '../../../models/DashboardActivityNotification';
import { CWText } from '../../components/component_kit/cw_text';
import { Feed } from '../../components/feed';
import ErrorPage from '../error';
import { DashboardViews } from '../user_dashboard';
import { fetchActivity } from '../user_dashboard/helpers';
import { DashboardCommunitiesPreview } from '../user_dashboard/dashboard_communities_preview';
import { CWTab, CWTabBar } from '../../components/component_kit/cw_tabs';

const FeedPage = () => {
  const [error, setError] = useState(null);
  const [scrollElement, setScrollElement] = React.useState(null);
  const [activeTab, setActiveTab] = useState('all');

  const getGlobalFeed = async () => {
    const activity = await fetchActivity(DashboardViews.Global);
    const formattedData = activity.result
      .map((item) => DashboardActivityNotification.fromJSON(item))
      .filter(
        (item) =>
          JSON.parse(item.notificationData).chain_id === app.activeChainId()
      );
    return { result: formattedData };
  };

  const getChainEvents = async () => {
    const activity = await fetchActivity(DashboardViews.Chain);
    const formattedData = activity.result
      .map((item) => DashboardActivityNotification.fromJSON(item))
      .filter((item) => item.chain === app.activeChainId());
    return { result: formattedData };
  };

  const getAllFeed = async () => {
    const results = await Promise.all([getGlobalFeed(), getChainEvents()]);
    return {
      result: sortFeed(results[0].result, results[1].result),
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

  return (
    <div ref={setScrollElement} className="FeedPage">
      <div className="dashboard-column">
        <div className="dashboard-header">
          <CWText type="h3" fontWeight="semiBold">
            Home
          </CWText>
          <div className="feed-tabs">
            <CWTabBar>
              <CWTab
                label="All"
                isSelected={activeTab === 'all'}
                onClick={() => setActiveTab('all')}
              />
              <CWTab
                label="Forum"
                isSelected={activeTab === 'forum'}
                onClick={() => setActiveTab('forum')}
              />
              <CWTab
                label="Chain"
                isSelected={activeTab === 'chain'}
                onClick={() => setActiveTab('chain')}
              />
            </CWTabBar>
          </div>
          {activeTab === 'all' && (
            <Feed
              key="all"
              fetchData={getAllFeed}
              noFeedMessage="No activity yet"
              customScrollParent={scrollElement}
            />
          )}
          {activeTab === 'forum' && (
            <Feed
              key="forum"
              fetchData={getGlobalFeed}
              noFeedMessage="No forum activity yet"
              customScrollParent={scrollElement}
            />
          )}
          {activeTab === 'chain' && (
            <Feed
              key="chain"
              fetchData={getChainEvents}
              noFeedMessage="No chain events yet"
              customScrollParent={scrollElement}
            />
          )}
        </div>
      </div>
      <div className="card-column">
        <DashboardCommunitiesPreview />
      </div>
    </div>
  );
};

export default FeedPage;
