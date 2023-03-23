import React from 'react';

import type { Topic } from 'models';

import { SelectList } from 'views/components/component_kit/cw_select_list';
import 'components/topic_selector.scss';

interface TopicSelectorProps {
  defaultTopic: Topic;
  topics: Topic[];
  onChange: (topic: Topic) => void;
}

const topicToOption = (topic: Topic) => ({
  value: topic?.id,
  label: topic?.name,
});

export const TopicSelector = ({
  defaultTopic,
  topics,
  onChange,
}: TopicSelectorProps) => {
  const options = topics
    .filter((topic) => topic.featuredInSidebar)
    .sort((a, b) => a.order - b.order)
    .map(topicToOption);

  const handleOnChange = ({ value }) => {
    const selectedTopic = topics.find(({ id }) => id === value);
    onChange(selectedTopic);
  };

  return (
    <SelectList
      defaultValue={defaultTopic ? topicToOption(defaultTopic) : null}
      placeholder="Select the topic"
      isSearchable={false}
      options={options}
      maxVisibleItems={10}
      className="TopicSelector"
      onChange={handleOnChange}
    />
  );
};
