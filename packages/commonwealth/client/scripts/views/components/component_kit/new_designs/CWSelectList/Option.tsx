import React from 'react';
import { components, OptionProps } from 'react-select';

export const Option = (props: OptionProps) => {
  const { label } = props;

  return (
    <components.Option {...props}>
      <div className="text-container">{label}</div>
    </components.Option>
  );
};
