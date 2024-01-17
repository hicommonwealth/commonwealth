import { useCommonNavigate } from 'client/scripts/navigation/helpers';
import { CWText } from 'client/scripts/views/components/component_kit/cw_text';
import {
  CWTab,
  CWTabsRow,
} from 'client/scripts/views/components/component_kit/new_designs/CWTabs';
import React, { useState } from 'react';
import CreateTopicSection from './CreateTopicsSection';
import ManageTopicsSection from './ManageTopicsSection';
import './Topics.scss';

export const Topics = () => {
  const TABS = [
    { value: 'create-topic', label: 'Create Topic' },
    { value: 'manage-topics', label: 'Manage Topics' },
  ];

  const navigate = useCommonNavigate();
  const [selectedTab, setSelectedTab] = useState(TABS[0].value);

  const updateActiveTab = (activeTab: string) => {
    const params = new URLSearchParams();
    params.set('tab', activeTab);
    navigate(`${window.location.pathname}?${params.toString()}`, {}, null);
    setSelectedTab(activeTab);
  };

  return (
    <div className="TopicsPage">
      <main>
        <CWText type="h2">Topics</CWText>
        <CWText type="b1" className="subheader">
          Create topics and sub-topics, and rearrange them in the sidebar
        </CWText>

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
          <CreateTopicSection />
        ) : (
          <ManageTopicsSection />
        )}
      </main>
      <aside></aside>
    </div>
  );
};

export default Topics;
