import React, { useState } from 'react';

import FeatureHint from 'views/components/FeatureHint';
import { CWText } from 'views/components/component_kit/cw_text';
import {
  CWTab,
  CWTabsRow,
} from 'views/components/component_kit/new_designs/CWTabs';

import { CreateTopicStep } from '../utils';
import CreateTopicSection from './CreateTopicsSection';
import ManageTopicsSection from './ManageTopicsSection';

import { TopicForm } from 'views/pages/CommunityManagement/Topics/Topics';
import './TopicDetails.scss';

const TABS = [
  { value: 'create-topic', label: 'Create Topic' },
  { value: 'manage-topics', label: 'Manage Topics' },
];

interface TopicDetailsProps {
  onStepChange: (step: CreateTopicStep) => void;
  onSetTopicFormData: (data: Partial<TopicForm>) => void;
  topicFormData: TopicForm | null;
}

const TopicDetails = ({
  onStepChange,
  onSetTopicFormData,
  topicFormData,
}: TopicDetailsProps) => {
  const [selectedTab, setSelectedTab] = useState(TABS[0].value);
  const isCreateTopicTab = selectedTab === TABS[0].value;

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
                onClick={() => setSelectedTab(tab.value)}
                isSelected={selectedTab === tab.value}
              />
            ))}
          </CWTabsRow>
          {isCreateTopicTab ? (
            <CreateTopicSection
              onStepChange={onStepChange}
              onSetTopicFormData={onSetTopicFormData}
              topicFormData={topicFormData}
            />
          ) : (
            <ManageTopicsSection />
          )}
        </main>
        <aside>
          <FeatureHint
            title="Topic Sorting"
            hint="Drag the topics on the left to the order you want them to appear
            on the side panel navigation of your community page. Tap the pencil
            icon to edit the topic or delete the topic."
          />
        </aside>
      </div>
    </div>
  );
};

export default TopicDetails;
