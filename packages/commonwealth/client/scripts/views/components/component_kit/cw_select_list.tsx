import React from 'react';
import type { GroupBase, OptionProps, Props } from 'react-select';
import Select, { components } from 'react-select';

import { CWTooltip } from 'views/components/component_kit/new_designs/CWTooltip';
import './cw_select_list.scss';

const CustomOption = (
  props: OptionProps & { disabledOptionTooltipText?: string },
) => {
  // eslint-disable-next-line react/destructuring-assignment
  if ((props.data as any)?.disabled) {
    return (
      <CWTooltip
        disablePortal
        // eslint-disable-next-line react/destructuring-assignment
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
            {/* eslint-disable-next-line react/destructuring-assignment */}
            {props.children}
          </components.Option>
        )}
      />
    );
  }

  // eslint-disable-next-line react/destructuring-assignment
  return <components.Option {...props}>{props.children}</components.Option>;
};

interface SelectListProps {
  disabledOptionTooltipText?: string;
}
// eslint-disable-next-line react/no-multi-comp
export const SelectList = <
  Option,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
>(
  props: Props<Option, IsMulti, Group> & SelectListProps,
) => {
  return (
    <Select
      {...props}
      isOptionDisabled={(option) => (option as any)?.disabled}
      components={{
        // eslint-disable-next-line react/no-multi-comp
        Option: (optionProps) => (
          // @ts-expect-error <StrictNullChecks/>
          <CustomOption
            {...optionProps}
            // eslint-disable-next-line react/no-children-prop, react/destructuring-assignment
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
      // eslint-disable-next-line react/destructuring-assignment
      className={`SelectList ${props.className || ''}`}
    />
  );
};
