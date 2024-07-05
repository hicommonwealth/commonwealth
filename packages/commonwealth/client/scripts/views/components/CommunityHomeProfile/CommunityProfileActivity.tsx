import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CWTab, CWTabsRow } from '../component_kit/new_designs/CWTabs';
import { Feed } from '../feed';
import { CWQuestCard } from '../component_kit/new_designs/CWQuestCard/CWQuestCard';
import app from 'state';
import { DashboardViews } from 'views/pages/user_dashboard';
import DashboardActivityNotification from 'models/DashboardActivityNotification';
import { fetchActivity } from 'views/pages/user_dashboard/helpers';
import 'components/CommunityHomeProfile/CommunityProfileActivity.scss';

enum CommunityActivityType {
  Activity,
  Quests
}

const CommmunityProfileActivity = () => {
  const [selectedActivity, setSelectedActivity] = useState(
    CommunityActivityType.Quests,
  );

  const handleTabChange = useCallback((newActivity: CommunityActivityType) => {
    setSelectedActivity(newActivity);
  }, []);

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

  // Mock data for Quests
  const mockQuests = [
    {
      name: 'Click to Win',
      description: 'Welcome signal, ban noise.',
      memberCount: 51000,
      threadCount: 0,
      reward: '10 $DILL',
      rewardDescription: 'per click'
    },
    {
      name: 'Top TG Post of the Week',
      description: '',
      memberCount: 5,
      threadCount: 1,
      reward: '$1000',
      rewardDescription: 'Avail.'
    },
    {
      name: 'Engage on Twitter',
      description: 'Each engagement wins',
      memberCount: 14,
      threadCount: 3,
      reward: '100xp',
      rewardDescription: 'Each'
    }
  ];

  return (
    <div className="ProfileActivity">
      <div className="activity-nav">
        <CWTabsRow>
          <CWTab
            label="Quests"
            onClick={() => handleTabChange(CommunityActivityType.Quests)}
            isSelected={selectedActivity === CommunityActivityType.Quests}
          />
          <CWTab
            label="Activity"
            onClick={() => handleTabChange(CommunityActivityType.Activity)}
            isSelected={selectedActivity === CommunityActivityType.Activity}
          />
        </CWTabsRow>
      </div>
      <div className="activity-content">
        {selectedActivity === CommunityActivityType.Activity ? (
          <Feed
            fetchData={getAllFeed}
            noFeedMessage="No activity to display"
            defaultCount={10}
          />
        ) : (
          <div className="quests-container">
            {mockQuests.map((quest, index) => (
              <CWQuestCard
                key={index}
                name={quest.name}
                description={quest.description}
                memberCount={quest.memberCount}
                threadCount={quest.threadCount}
                reward={quest.reward}
                rewardDescription={quest.rewardDescription}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommmunityProfileActivity;
