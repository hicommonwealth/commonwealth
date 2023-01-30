/* @jsx jsx */
import React from 'react';

import { jsx } from 'mithrilInterop';

import 'components/component_kit/cw_checkbox.scss';

import { ComponentType, BaseStyleProps } from './types';
import { getClasses } from './helpers';
import { CWText } from './cw_text';

export type CheckboxType = { label?: string; value?: string };

type CheckboxStyleProps = {
  checked?: boolean;
  indeterminate?: boolean;
} & BaseStyleProps;

type CheckboxProps = {
  groupName?: string;
  onChange?: (e?: any) => void;
} & CheckboxType &
  CheckboxStyleProps;

export const CWCheckbox = (props: CheckboxProps) => {
  const {
    className,
    disabled = false,
    indeterminate = false,
    label,
    onChange,
    checked,
    value,
  } = props;

  const params = {
    disabled,
    onChange,
    checked,
    type: 'checkbox',
    value,
  };

  return (
    <label
      className={getClasses<CheckboxStyleProps>(
        {
          checked,
          disabled,
          indeterminate,
          className,
        },
        ComponentType.Checkbox
      )}
    >
      <input className="checkbox-input" {...params} />
      <div className="checkbox-control" />
      <CWText className="checkbox-label">{label || value}</CWText>
    </label>
  );
};
