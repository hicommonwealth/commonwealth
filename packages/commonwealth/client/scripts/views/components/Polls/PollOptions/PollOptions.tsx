import React from 'react';
import { CWRadioButton } from 'views/components/component_kit/cw_radio_button';

import './PollOptions.scss';

export type VoteInformation = {
  label: string;
  value: string;
  voteCount: number;
};

export type PollOptionProps = {
  voteInformation: Array<VoteInformation>;
  selectedOptions?: Array<string>;
  disableVoteOptions?: boolean;
  setSelectedOptions?: React.Dispatch<React.SetStateAction<string[]>>;
};

export const PollOptions = ({
  disableVoteOptions,
  selectedOptions,
  voteInformation,
  setSelectedOptions,
}: PollOptionProps) => {
  return (
    <div className="PollOptions">
      {voteInformation.map((option) => (
        <CWRadioButton
          key={option.value}
          checked={
            (selectedOptions?.length || 0) > 0 &&
            option.value === selectedOptions?.[0]
          }
          groupName="votes"
          onChange={() => setSelectedOptions?.([option.value])}
          label={option.label}
          value={option.value}
          disabled={disableVoteOptions}
        />
      ))}
    </div>
  );
};
