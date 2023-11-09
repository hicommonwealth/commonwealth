import clsx from 'clsx';
import React from 'react';
import { ComponentType } from '../../types';
import { CWSelectList } from '../CWSelectList';
import './CWTypeaheadSelectList.scss';
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
      <CWSelectList
        defaultValue={defaultValue}
        options={options}
        isSearchable={true}
        isClearable={false}
        classNamePrefix="tasl"
        placeholder={placeholder}
        noOptionsMessage={() => 'No matches found.'}
        isDisabled={isDisabled}
        className={clsx(isDisabled && 'disabled')}
        onChange={onChange}
      />
    </div>
  );
};
