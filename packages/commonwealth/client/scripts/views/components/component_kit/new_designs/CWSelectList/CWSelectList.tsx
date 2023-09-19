import './CWSelectList.scss';
import React from 'react';
import type { GroupBase, Props } from 'react-select';
import Select, { components } from 'react-select';
import { CWIcon } from '../../cw_icons/cw_icon';
import { getClasses } from '../../helpers';
import { ComponentType } from '../../types';

export const CWSelectList = <
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
      components={{
        DropdownIndicator: () => (
          <CWIcon className="caret-icon" iconName={'caretDown'} />
        ),
        MultiValueRemove: (removeProps) => (
          <components.MultiValueRemove {...removeProps}>
            <CWIcon iconName="close" className="close-btn" />
          </components.MultiValueRemove>
        ),
      }}
      className={getClasses<{
        isMulti?: boolean;
        className?: string;
      }>(
        {
          isMulti: props.isMulti,
          className: props.className,
        },
        ComponentType.SelectList
      )}
    />
  );
};
