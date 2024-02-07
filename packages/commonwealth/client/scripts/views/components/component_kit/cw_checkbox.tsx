import React from 'react';

import 'components/component_kit/cw_checkbox.scss';
import { CWText } from './cw_text';
import { getClasses } from './helpers';

import clsx from 'clsx';
import type { BaseStyleProps } from './types';
import { ComponentType } from './types';

export type CheckboxType = { label?: string | React.ReactNode; value?: string };

type CheckboxStyleProps = {
  checked?: boolean;
  indeterminate?: boolean;
} & BaseStyleProps;

type CheckboxProps = {
  groupName?: string;
  onChange?: (e?: any) => void;
  labelClassName?: string;
} & CheckboxType &
  CheckboxStyleProps;

export const CWCheckbox = ({
  className,
  disabled = false,
  indeterminate = false,
  label,
  onChange,
  checked,
  value,
  labelClassName,
}: CheckboxProps) => {
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
        ComponentType.Checkbox,
      )}
    >
      <div className="check">
        <input className="checkbox-input" {...params} />
        <div className="checkbox-control" />
      </div>
      <CWText className={clsx('checkbox-label', labelClassName)}>
        {label || value}
      </CWText>
    </label>
  );
};
