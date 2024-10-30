import { useCommonNavigate } from 'navigation/helpers';
import React, { useState } from 'react';
import FeatureHint from 'views/components/FeatureHint';
import { CWText } from 'views/components/component_kit/cw_text';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import {
  CWTab,
  CWTabsRow,
} from 'views/components/component_kit/new_designs/CWTabs';
import CreateTopicSectionOld from './CreateTopicsSectionOld';
import ManageTopicsSectionOld from './ManageTopicsSectionOld';

import useUserStore from 'client/scripts/state/ui/user';
import Permissions from 'client/scripts/utils/Permissions';
import { PageNotFound } from '../../../404';
import './TopicsOld.scss';

const TABS = [
  { value: 'create-topic', label: 'Create Topic' },
  { value: 'manage-topics', label: 'Manage Topics' },
];

export const TopicsOld = () => {
  const navigate = useCommonNavigate();
  const user = useUserStore();
  const [selectedTab, setSelectedTab] = useState(TABS[0].value);

  const updateActiveTab = (activeTab: string) => {
    const params = new URLSearchParams();
    params.set('tab', activeTab);
    navigate(`${window.location.pathname}?${params.toString()}`, {}, null);
    setSelectedTab(activeTab);
  };

  if (
    !user.isLoggedIn ||
    !(Permissions.isSiteAdmin() || Permissions.isCommunityAdmin())
  ) {
    return <PageNotFound />;
  }
  return (
    <CWPageLayout>
      <div className="TopicsOld">
        <header>
          <CWText type="h2">Topics</CWText>
          <CWText type="b1" className="subheader">
            Create topics and sub-topics, and rearrange them in the sidebar
          </CWText>
        </header>
        <div className="content-container">
          <main>
            <CWTabsRow>
              {TABS.map((tab, index) => (
                <CWTab
                  key={index}
                  label={tab.label}
                  onClick={() => updateActiveTab(tab.value)}
                  isSelected={selectedTab === tab.value}
                />
              ))}
            </CWTabsRow>
            {selectedTab === TABS[0].value ? (
              <CreateTopicSectionOld />
            ) : (
              <ManageTopicsSectionOld />
            )}
          </main>
          <aside>
            {selectedTab === TABS[0].value ? (
              <FeatureHint
                title="Topics and Subtopics"
                hint="Top level topics can act as parents to subtopics. Subtopics can not have additional subtopics."
              />
            ) : (
              <FeatureHint
                title="Topic Sorting"
                hint="Drag the topics on the left to the order you want them to appear
            on the side panel navigation of your community page. Tap the pencil
            icon to edit the topic or delete the topic."
              />
            )}
          </aside>
        </div>
      </div>
    </CWPageLayout>
  );
};

export default TopicsOld;
