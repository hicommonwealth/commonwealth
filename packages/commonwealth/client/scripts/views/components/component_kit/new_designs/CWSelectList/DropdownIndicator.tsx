import React from 'react';
import { DropdownIndicatorProps } from 'react-select';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';

export const DropdownIndicator = (props: DropdownIndicatorProps) => {
  const {
    selectProps: { menuIsOpen },
  } = props;

  return menuIsOpen ? (
    <CWIcon className="caret-icon" iconName="caretUp" iconSize="small" />
  ) : (
    <CWIcon className="caret-icon" iconName="caretDown" iconSize="small" />
  );
};
