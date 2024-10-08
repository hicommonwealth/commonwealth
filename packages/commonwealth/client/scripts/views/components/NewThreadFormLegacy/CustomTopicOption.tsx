import Topic from 'models/Topic';
import React from 'react';
import { components, OptionProps } from 'react-select';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';

interface CustomTopicOptionProps {
  originalProps: OptionProps<{ value: string; label: string }>;
  topic?: Topic;
}

const CustomTopicOption = ({
  originalProps,
  topic,
}: CustomTopicOptionProps) => {
  return (
    // @ts-expect-error <StrictNullChecks/>
    <components.Option {...originalProps}>
      {(topic?.activeContestManagers?.length || 0) > 0 && (
        <CWIcon iconName="trophy" iconSize="small" />
      )}
      {originalProps.label}
    </components.Option>
  );
};

export default CustomTopicOption;
