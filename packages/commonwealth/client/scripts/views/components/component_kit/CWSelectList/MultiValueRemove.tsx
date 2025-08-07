import React from 'react';
import { components, MultiValueRemoveProps } from 'react-select';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';

export const MultiValueRemove = (props: MultiValueRemoveProps) => {
  return (
    <components.MultiValueRemove {...props}>
      <CWIcon iconName="close" className="close-btn" />
    </components.MultiValueRemove>
  );
};
