import React, { ReactNode } from 'react';
import { useFormContext } from 'react-hook-form';

import clsx from 'clsx';
import { CWText } from '../cw_text';
import './cw_radio_button.scss';

export type RadioButtonType = {
  label?: string | ReactNode;
  value: string;
  disabled?: boolean;
};

type RadioButtonStyleProps = {
  disabled?: boolean;
  checked?: boolean;
};

type RadioButtoFormValidationProps = {
  name?: string;
  hookToForm?: boolean;
};

export type RadioButtonProps = {
  groupName?: string;
  onChange?: (e?: any) => void;
  hideLabels?: boolean;
  className?: string;
} & Omit<RadioButtonType, 'disabled'> &
  RadioButtonStyleProps &
  RadioButtoFormValidationProps;

export const CWRadioButton = (props: RadioButtonProps) => {
  const {
    name,
    hookToForm,
    disabled = false,
    groupName,
    label,
    onChange,
    checked,
    value,
    hideLabels,
    className,
  } = props;

  const formContext = useFormContext();
  const formFieldContext = hookToForm
    ? // @ts-expect-error <StrictNullChecks/>
      formContext.register(name)
    : ({} as any);

  // TODO: this message is not needed now, but when its needed it should be coming from the radio group
  // const formFieldErrorMessage =
  //   hookToForm && (formContext?.formState?.errors?.[name]?.message as string);

  return (
    <label className={clsx('container', className)}>
      <input
        type="radio"
        className={`radio-button ${disabled ? 'disabled' : ''}`}
        disabled={disabled}
        checked={checked}
        name={groupName}
        value={value}
        {...formFieldContext}
        onChange={async (e) => {
          hookToForm && (await formFieldContext?.onChange(e));
          await onChange?.(e);
        }}
      />
      {!hideLabels && (
        <CWText className="label" type="b2" fontWeight="regular">
          {label || value}
        </CWText>
      )}
    </label>
  );
};
