import React from 'react';
import type { GroupBase, Props } from 'react-select';
import Select from 'react-select';

import 'components/component_kit/cw_select_list.scss';

type SelectListProps<
  Option,
  IsMulti extends boolean,
  Group extends GroupBase<Option>
> = Props<Option, IsMulti, Group> & {
  menuMaxHeight?: string;
};

export const SelectList = <
  Option,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
>(
  props: SelectListProps<Option, IsMulti, Group>
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
          maxHeight: props.menuMaxHeight || '100px', // Set the desired maximum height for the scrollable menu
          overflowY: 'auto', // Enable vertical scrolling
        }),
      }}
      className={`SelectList ${props.className || ''}`}
    />
  );
};
