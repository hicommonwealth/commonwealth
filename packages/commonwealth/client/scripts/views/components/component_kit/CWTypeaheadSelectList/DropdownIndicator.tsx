import React from 'react';
import { components, DropdownIndicatorProps } from 'react-select';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';

export const DropdownIndicator = (props: DropdownIndicatorProps) => {
  const {
    selectProps: { menuIsOpen },
  } = props;

  return (
    <components.DropdownIndicator {...props}>
      {menuIsOpen ? (
        <CWIcon iconName="chevronUp" iconSize="small" />
      ) : (
        <CWIcon iconName="chevronDown" iconSize="small" />
      )}
    </components.DropdownIndicator>
  );
};
