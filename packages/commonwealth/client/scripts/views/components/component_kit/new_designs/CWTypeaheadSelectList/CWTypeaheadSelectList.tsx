import clsx from 'clsx';
import React from 'react';
import Select from 'react-select';
import { ComponentType } from '../../types';
import './CWTypeaheadSelectList.scss';
import { DropdownIndicator } from './DropdownIndicator';
import { Option } from './Option';

export type SelectListOption = {
  value: string;
  label: string;
};

type TypeaheadSelectListProps = {
  options: SelectListOption[];
  defaultValue: SelectListOption;
  placeholder: string;
  isDisabled?: boolean;
  onChange?: (newOption: SelectListOption) => void;
};

export const CWTypeaheadSelectList = ({
  options,
  defaultValue,
  placeholder,
  isDisabled = false,
  onChange,
}: TypeaheadSelectListProps) => {
  return (
    <div className={ComponentType.TypeaheadSelectList}>
      <Select
        styles={{
          control: (baseStyles) => ({
            ...baseStyles,
            // removes unnecessary styles
            border: 0,
            boxShadow: 'none',
            minHeight: 'unset',
          }),
          menu: (baseStyles) => ({
            ...baseStyles,
            maxHeight: '300px',
          }),
        }}
        components={{ DropdownIndicator, Option }}
        defaultValue={defaultValue}
        options={options}
        isSearchable={true}
        isClearable={false}
        classNamePrefix="tasl"
        placeholder={placeholder}
        noOptionsMessage={() => 'No matches found.'}
        isDisabled={isDisabled}
        className={clsx(`SelectList`, isDisabled && 'disabled')}
        onChange={onChange}
      />
    </div>
  );
};
