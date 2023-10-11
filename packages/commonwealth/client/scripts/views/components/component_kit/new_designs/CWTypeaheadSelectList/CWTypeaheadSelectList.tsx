import React from 'react';
import { SelectList } from '../../cw_select_list';
import { components } from 'react-select';
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
  let isMenuOpen = props.selectProps.menuIsOpen;

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
      <SelectList
        components={{ DropdownIndicator, Option }}
        defaultValue={defaultValue}
        options={options}
        isSearchable={true}
        isClearable={false}
        classNamePrefix="tasl"
        placeholder={placeholder}
        noOptionsMessage={() => 'No matches found.'}
        isDisabled={isDisabled}
        className={isDisabled ? 'disabled' : ''}
      />
    </div>
  );
};
