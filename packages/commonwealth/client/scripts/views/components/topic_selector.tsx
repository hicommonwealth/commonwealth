import React from 'react';
import Topic from '../../models/Topic';

import 'components/topic_selector.scss';
import { SelectList } from 'views/components/component_kit/cw_select_list';

interface TopicSelectorProps {
  enabledTopics: Topic[];
  disabledTopics: Topic[];
  value: Topic;
  onChange: (topic: Topic) => void;
}

const topicToOption = (topic: Topic, disabled: boolean) => ({
  value: topic?.id,
  label: topic?.name,
  disabled,
});

export const TopicSelector = ({
  enabledTopics,
  disabledTopics,
  value,
  onChange,
}: TopicSelectorProps) => {
  const enabledOptions = enabledTopics
    .sort((a, b) => a.order - b.order)
    .map((t) => topicToOption(t, false));
  const disabledOptions = disabledTopics
    .sort((a, b) => a.order - b.order)
    .map((t) => topicToOption(t, true));
  const allOptions = enabledOptions.concat(disabledOptions);

  const handleOnChange = ({ value: newValue }) => {
    const selectedTopic = enabledTopics.find(({ id }) => id === newValue);
    onChange(selectedTopic);
  };

  return (
    <SelectList
      placeholder="Select the topic"
      disabledOptionTooltipText="You don't have enough token to select this topic."
      isSearchable={false}
      options={allOptions}
      className="TopicSelector"
      onChange={handleOnChange}
      value={value ? topicToOption(value, false) : undefined}
    />
  );
};
