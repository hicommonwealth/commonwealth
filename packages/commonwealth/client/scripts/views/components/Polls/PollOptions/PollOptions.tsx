import { CWRadioButton } from 'client/scripts/views/components/component_kit/cw_radio_button_old';
import React from 'react';

import './PollOptions.scss';

export type VoteInformation = {
  label: string;
  value: string;
  voteCount: bigint;
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
