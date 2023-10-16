import React from 'react';
import Select, { components } from 'react-select';
import { ComponentType } from '../../types';
import './CWTypeaheadSelectList.scss';
import { CWIcon } from '../../cw_icons/cw_icon';

type SelectListOption = {
  value: any;
  label: string;
};

type TypeaheadSelectListProps = {
  options: SelectListOption[];
  defaultValue: SelectListOption;
  placeholder: string;
  isDisabled?: boolean;
};

const DropdownIndicator = (props) => {
  const isMenuOpen = props.selectProps.menuIsOpen;

  return (
    <components.DropdownIndicator {...props}>
      {isMenuOpen ? (
        <CWIcon iconName="chevronUp" iconSize="small" />
      ) : (
        <CWIcon iconName="chevronDown" iconSize="small" />
      )}
    </components.DropdownIndicator>
  );
};

const Option = (props) => {
  return (
    <components.Option {...props}>
      <div className="text-container">{props.label}</div>
    </components.Option>
  );
};

export const CWTypeaheadSelectList = ({
  options,
  defaultValue,
  placeholder,
  isDisabled = false,
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
        className={`SelectList ${isDisabled ? 'disabled' : ''}`}
      />
    </div>
  );
};
