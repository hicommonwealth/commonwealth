import React, { useState } from 'react';

import { useCommonNavigate } from 'navigation/helpers';
import FeatureHint from 'views/components/FeatureHint';
import { CWText } from 'views/components/component_kit/cw_text';
import {
  CWTab,
  CWTabsRow,
} from 'views/components/component_kit/new_designs/CWTabs';

import CreateTopicSection from '../CreateTopicsSection';
import ManageTopicsSection from '../ManageTopicsSection';
import { CreateTopicStep } from '../utils';

import './TopicDetails.scss';

const TABS = [
  { value: 'create-topic', label: 'Create Topic' },
  { value: 'manage-topics', label: 'Manage Topics' },
];

interface TopicDetailsProps {
  onStepChange: (step: CreateTopicStep) => void;
}

const TopicDetails = ({ onStepChange }: TopicDetailsProps) => {
  const navigate = useCommonNavigate();
  const [selectedTab, setSelectedTab] = useState(TABS[0].value);

  const updateActiveTab = (activeTab: string) => {
    const params = new URLSearchParams();
    params.set('tab', activeTab);
    navigate(`${window.location.pathname}?${params.toString()}`, {}, null);
    setSelectedTab(activeTab);
  };

  return (
    <div className="TopicDetails">
      <header>
        <CWText type="h2">Topics New</CWText>
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
            <CreateTopicSection onStepChange={onStepChange} />
          ) : (
            <ManageTopicsSection />
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
      Topic Details
      <p onClick={() => onStepChange(CreateTopicStep.WVConsent)}>next</p>
    </div>
  );
};

export default TopicDetails;
