import 'components/component_kit/cw_select_list.scss';
import React from 'react';
import type { GroupBase, Props } from 'react-select';
import Select from 'react-select';

export const SelectList = <
  Option,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
>(
  props: Props<Option, IsMulti, Group>
) => {
  return (
    <Select
      {...props}
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
      className={`SelectList ${props.className || ''}`}
    />
  );
};
