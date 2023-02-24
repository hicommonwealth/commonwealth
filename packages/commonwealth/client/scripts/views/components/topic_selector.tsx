import React from 'react';
import Select from 'react-select';

import type { Topic } from 'models';

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
    .sort((a, b) => a.order -b.order)
    .map(topicToOption);

  const handleOnChange = ({ value }) => {
    const selectedTopic = topics.find(({ id }) => id === value);
    onChange(selectedTopic);
  };

  return (
    <Select
      defaultValue={defaultTopic ? topicToOption(defaultTopic) : null}
      placeholder="Select the topic"
      isSearchable={false}
      options={options}
      className="TopicSelector"
      onChange={handleOnChange}
    />
  );
};
