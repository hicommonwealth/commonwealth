import React, { useState } from 'react';
import type Topic from '../../models/Topic';

import { SelectList } from 'views/components/component_kit/cw_select_list';
import 'components/topic_selector.scss';
import { CWTooltip } from './component_kit/new_designs/CWTooltip';

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
      isSearchable={false}
      options={allOptions}
      className="TopicSelector"
      onChange={handleOnChange}
    />
  );
};
