import React from 'react';
import { SelectList } from '../../cw_select_list';
import { ComponentType } from '../../types';
import './CWTypeaheadSelectList.scss';

type SelectListOption = {
  value: any;
  label: string;
};

type TypeaheadSelectListProps = {
  options: SelectListOption[];
  defaultValue?: SelectListOption;
  placeholder?: string;
};

export const CWTypeaheadSelectList = ({ options, defaultValue, placeholder }: TypeaheadSelectListProps) => {

  return (
    <div className={ComponentType.TypeaheadSelectList}>
      <SelectList
        defaultValue={defaultValue}
        options={options}
        isSearchable={true}
        isClearable={true}
        classNamePrefix="tasl"
        placeholder={placeholder}
        noOptionsMessage={() => 'No matches found.'}
      />
    </div>
  );
};
