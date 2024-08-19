import React from 'react';
import { CWCheckbox } from 'views/components/component_kit/cw_checkbox';
import { CWRadioButton } from 'views/components/component_kit/cw_radio_button';

import './PollOptions.scss';

export type VoteInformation = {
  label: string;
  value: string;
  voteCount: number;
};

export type PollOptionProps = {
  multiSelect: boolean;
  voteInformation: Array<VoteInformation>;
  selectedOptions?: Array<string>;
  disableVoteOptions?: boolean;
  setSelectedOptions?: React.Dispatch<React.SetStateAction<string[]>>;
};

export const PollOptions = ({
  disableVoteOptions,
  multiSelect,
  selectedOptions,
  voteInformation,
  setSelectedOptions,
}: PollOptionProps) => {
  return (
    <div className="PollOptions">
      {multiSelect
        ? voteInformation.map((option) => (
            <CWCheckbox
              checked={false}
              value=""
              label={option.label}
              key={option.value}
              onChange={() => {
                // TODO: Build this out when multiple vote options are introduced.
                // Something like: selectedOptions.push(option.value);
                console.log('A vote for multiple options');
              }}
            />
          ))
        : voteInformation.map((option) => (
            <CWRadioButton
              key={option.value}
              checked={
                // @ts-expect-error <StrictNullChecks/>
                selectedOptions.length > 0 &&
                // @ts-expect-error <StrictNullChecks/>
                option.value === selectedOptions[0]
              }
              groupName="votes"
              // @ts-expect-error <StrictNullChecks/>
              onChange={() => setSelectedOptions([option.value])}
              label={option.label}
              value={option.value}
              disabled={disableVoteOptions}
            />
          ))}
    </div>
  );
};
