import { CreateGroup, UpdateGroup } from '@hicommonwealth/schemas';
import { GatedActionEnum, UserFriendlyActionMap } from '@hicommonwealth/shared';
import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { z } from 'zod';

interface TopicOption {
  label: string;
  value: number;
}

interface TopicsFormProps {
  groupState:
    | z.infer<typeof CreateGroup.input>
    | z.infer<typeof UpdateGroup.input>;
  setGroupState: React.Dispatch<React.SetStateAction<any>>;
  errors: Record<string, string>;
  topics?: TopicOption[];
}

const gatedActions = Object.values(GatedActionEnum);

const TopicsForm: React.FC<TopicsFormProps> = ({
  groupState,
  setGroupState,
  errors,
  topics = [],
}) => {
  const selectedTopics = groupState.topics || [];

  const handleTopicsChange = (selected) => {
    // selected is array of {label, value}
    const newTopics = selected.map((t) => {
      const existing = selectedTopics.find((topic) => topic.id === t.value);
      return existing || { id: t.value, is_private: false, permissions: [] };
    });
    setGroupState((prev) => ({ ...prev, topics: newTopics }));
  };

  const toggleAction = (topicIdx, action) => {
    setGroupState((prev) => {
      const newTopics = [...(prev.topics || [])];
      const topic = { ...newTopics[topicIdx] };
      if (!topic.permissions) topic.permissions = [];
      if (topic.permissions.includes(action)) {
        topic.permissions = topic.permissions.filter((a) => a !== action);
      } else {
        topic.permissions = [...topic.permissions, action];
      }
      newTopics[topicIdx] = topic;
      return { ...prev, topics: newTopics };
    });
  };

  return (
    <section className="form-section">
      <div className="header-row">
        <CWText type="h4" fontWeight="semiBold" className="header-text">
          Gate topics
        </CWText>
        <CWText type="b2">
          Add topics that only group members who satisfy the requirements above
          can participate in.
        </CWText>
      </div>
      <CWSelectList
        label="Topics"
        options={topics}
        value={selectedTopics
          .map((t) => topics.find((mt) => mt.value === t.id))
          .filter(Boolean)}
        isMulti
        isClearable={false}
        placeholder="Type in topic name"
        onChange={handleTopicsChange}
      />
      {selectedTopics.map((topic, idx) => (
        <div
          key={topic.id}
          style={{ border: '1px solid #eee', margin: 8, padding: 8 }}
        >
          <div>
            {topics.find((t) => t.value === topic.id)?.label || topic.id}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {gatedActions.map((action) => (
              <CWButton
                key={action}
                label={UserFriendlyActionMap[action]}
                type="button"
                buttonType={
                  topic.permissions?.includes(action) ? 'primary' : 'secondary'
                }
                onClick={() => toggleAction(idx, action)}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
};

export default TopicsForm;
