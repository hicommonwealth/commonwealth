import React from 'react';
import { components, OptionProps } from 'react-select';

export const Option = (props: OptionProps) => {
  const { label } = props;
  const helpText = (props?.data as any)?.helpText;

  return (
    <components.Option {...props}>
      <div className="text-container">{label}</div>
      {helpText && <span className="text-container">{helpText}</span>}
    </components.Option>
  );
};
