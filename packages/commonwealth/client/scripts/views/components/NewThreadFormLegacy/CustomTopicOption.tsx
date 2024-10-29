import type { Topic } from 'models/Topic';
import React from 'react';
import { components, OptionProps } from 'react-select';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';

interface CustomTopicOptionProps {
  originalProps: OptionProps<{ value: string; label: string }>;
  topic?: Topic;
  helpText?: string;
}

const CustomTopicOption = ({
  originalProps,
  topic,
  helpText,
}: CustomTopicOptionProps) => {
  return (
    // @ts-expect-error <StrictNullChecks/>
    <components.Option {...originalProps}>
      {(topic?.active_contest_managers?.length || 0) > 0 && (
        <CWIcon iconName="trophy" iconSize="small" />
      )}
      {originalProps.label}
      {helpText && <span className="help-text-container">{helpText}</span>}
    </components.Option>
  );
};

export default CustomTopicOption;
