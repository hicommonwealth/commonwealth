import React from 'react';

import 'components/component_kit/cw_checkbox.scss';
import { CWText } from './cw_text';
import { getClasses } from './helpers';

import clsx from 'clsx';
import { useFormContext } from 'react-hook-form';
import type { BaseStyleProps } from './types';
import { ComponentType } from './types';

export type CheckboxType = { label?: string | React.ReactNode; value?: string };

type CheckboxStyleProps = {
  checked?: boolean;
  indeterminate?: boolean;
} & BaseStyleProps;

type CheckboxFormValidationProps = {
  name?: string;
  hookToForm?: boolean;
};

type CheckboxProps = {
  groupName?: string;
  onChange?: (e?: any) => void;
  labelClassName?: string;
} & CheckboxType &
  CheckboxStyleProps &
  CheckboxFormValidationProps;

export const CWCheckbox = ({
  name,
  hookToForm,
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
    name,
    disabled,
    onChange,
    checked,
    type: 'checkbox',
    value,
  };

  const formContext = useFormContext();
  const formFieldContext = hookToForm
    ? formContext.register(name)
    : ({} as any);

  // TODO: this message is not needed now, but when its needed it should be coming from the radio group
  // const formFieldErrorMessage =
  //   hookToForm && (formContext?.formState?.errors?.[name]?.message as string);

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
        <input
          className={clsx('checkbox-input', { disabled })}
          {...params}
          {...formFieldContext}
          onChange={async (e) => {
            hookToForm && name && (await formFieldContext?.onChange(e));
            await onChange?.(e);
          }}
        />
        <div className="checkbox-control" />
      </div>
      <CWText className={clsx('checkbox-label', labelClassName)}>
        {label || value}
      </CWText>
    </label>
  );
};
