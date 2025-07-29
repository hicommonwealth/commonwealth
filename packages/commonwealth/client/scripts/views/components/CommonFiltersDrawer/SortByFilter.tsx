import React from 'react';
import { CWRadioButton } from 'views/components/component_kit/new_designs/cw_radio_button';
import CWAccordion from '../CWAccordion';

export type SortByFilterOption = {
  label: string;
  value: string;
};

export type SortByFilterProps = {
  options: SortByFilterOption[];
  selected: string | undefined;
  onChange: (value: string) => void;
  groupName: string;
  disabled?: boolean;
};

export const SortByFilter = ({
  options,
  selected,
  onChange,
  groupName,
  disabled,
}: SortByFilterProps) => {
  return (
    <CWAccordion
      header="Sort By"
      content={
        <div className="options-list">
          {options.map((opt) => (
            <CWRadioButton
              key={opt.value}
              groupName={groupName}
              value={opt.value}
              label={opt.label}
              checked={selected === opt.value}
              onChange={() => onChange(opt.value)}
              disabled={disabled}
            />
          ))}
        </div>
      }
    />
  );
};
