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
  maxVisibleItems?: number;
};

export const SelectList = <
  Option,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
>(
  props: SelectListProps<Option, IsMulti, Group>
) => {
  // Calculate the menuMaxHeight based on maxVisibleItems and item height
  const itemHeight = 30; // Adjust this value according to your specific item height
  const menuMaxHeight = (props.maxVisibleItems || 5) * itemHeight + 'px';

  return (
    <Select
      {...props}
      styles={{
        // ... other styles ...
        menu: (baseStyles) => ({
          ...baseStyles,
          maxHeight: props.menuMaxHeight || menuMaxHeight,
          overflowY: 'auto', // Enable vertical scrolling
        }),
      }}
      className={`SelectList ${props.className || ''}`}
    />
  );
};
