import React from 'react';
import type { GroupBase, OptionProps, Props } from 'react-select';
import Select, { components } from 'react-select';

import 'components/component_kit/cw_select_list.scss';
import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';

const CustomOption = (
  props: OptionProps & { disabledOptionTooltipText?: string }
) => {
  if ((props.data as any)?.disabled) {
    return (
      <CWTooltip
        disablePortal
        content={props.disabledOptionTooltipText || 'Option not allowed'}
        placement="top"
        renderTrigger={(handleInteraction) => (
          <components.Option
            {...props}
            isDisabled
            innerProps={{
              onMouseEnter: handleInteraction,
              onMouseLeave: handleInteraction,
              style: {
                color: '#A09DA1', // neutral-400
                cursor: 'not-allowed',
              },
            }}
          >
            {props.children}
          </components.Option>
        )}
      />
    );
  }

  return <components.Option {...props}>{props.children}</components.Option>;
};

interface SelectListProps {
  disabledOptionTooltipText?: string;
}
export const SelectList = <
  Option,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
>(
  props: Props<Option, IsMulti, Group> & SelectListProps
) => {
  return (
    <Select
      {...props}
      isOptionDisabled={(option) => (option as any)?.disabled}
      components={{
        Option: (optionProps) => (
          <CustomOption
            {...optionProps}
            children={optionProps.children}
            disabledOptionTooltipText={props.disabledOptionTooltipText}
          />
        ),
      }}
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
