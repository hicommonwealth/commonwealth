import { TopicWeightedVoting } from '@hicommonwealth/schemas';
import React from 'react';
import { GroupBase, OptionProps, components } from 'react-select';
import { CWText } from 'views/components/component_kit/cw_text';

type TopicOptionType =
  | {
      value: number | undefined;
      label: string;
      helpText: string;
      weightedVoting: TopicWeightedVoting | null | undefined;
      tokenAddress?: string | null | undefined;
    }
  | {
      value: string;
      label: string;
      helpText: string;
      weightedVoting: null;
      tokenAddress?: string | null | undefined;
    };

interface CustomContestTopicOptionProps {
  originalProps: OptionProps<
    TopicOptionType,
    false,
    GroupBase<TopicOptionType>
  >;
}

const CustomContestTopicOption = ({
  originalProps,
}: CustomContestTopicOptionProps) => {
  if (originalProps.data.value === 'create-new') {
    return (
      <components.Option {...originalProps}>
        <CWText type="b1" className="create-new-topic-btn">
          Create new topic
        </CWText>
      </components.Option>
    );
  }

  return (
    <components.Option {...originalProps}>
      {originalProps.label}
      {originalProps.data.helpText && (
        <span className="help-text-container">
          {originalProps.data.helpText}
        </span>
      )}
    </components.Option>
  );
};

export default CustomContestTopicOption;
