import React from 'react';
import type Topic from '../../models/Topic';

import { SelectList } from 'views/components/component_kit/cw_select_list';
import 'components/topic_selector.scss';

interface TopicSelectorProps {
  topics: Topic[];
  value: Topic;
  onChange: (topic: Topic) => void;
}

const topicToOption = (topic: Topic) => ({
  value: topic?.id,
  label: topic?.name,
});

export const TopicSelector = ({
  topics,
  value,
  onChange,
}: TopicSelectorProps) => {
  const options = topics.sort((a, b) => a.order - b.order).map(topicToOption);

  const handleOnChange = ({ value: newValue }) => {
    const selectedTopic = topics.find(({ id }) => id === newValue);
    onChange(selectedTopic);
  };

  return (
    <SelectList
      placeholder="Select the topic"
      isSearchable={false}
      options={options}
      className="TopicSelector"
      value={topicToOption(value)}
      onChange={handleOnChange}
    />
  );
};
