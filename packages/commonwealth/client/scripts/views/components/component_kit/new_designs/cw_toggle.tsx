import React, { useState } from 'react';

import 'components/component_kit/new_designs/cw_toggle.scss';

import { useFormContext } from 'react-hook-form';
import { setDarkMode } from '../../../../helpers/darkMode';
import { getClasses } from '../helpers';
import type { BaseStyleProps } from '../types';
import { ComponentType } from '../types';

export const toggleDarkMode = (on: boolean, stateFn?: Function) => {
  setDarkMode(on);
  localStorage.setItem('user-dark-mode-state', on ? 'on' : 'off');
  stateFn(on);
};

type FormFieldValidationProps = {
  hookToForm?: boolean;
  name?: string;
};

export type ToggleStyleProps = {
  checked?: boolean;
  size: 'small' | 'large';
} & BaseStyleProps &
  FormFieldValidationProps;

export type ToggleProps = {
  onChange?: (e?: any) => void;
} & ToggleStyleProps;

export const CWToggle = (props: ToggleProps) => {
  const {
    className,
    disabled = false,
    onChange,
    checked,
    size,
    name,
    hookToForm,
  } = props;

  const params = {
    disabled,
    onChange,
    checked,
    type: 'checkbox',
  };

  const formContext = useFormContext();
  const formFieldContext =
    hookToForm && name ? formContext.register(name) : ({} as any);
  // TODO: display error when needed
  // const formFieldErrorMessage =
  //   hookToForm && name && (formContext?.formState?.errors?.[name]?.message as string);
  const [formCheckedStatus, setFormCheckedStatus] = useState(
    formContext?.getValues?.(name),
  );

  return (
    <label
      className={getClasses<ToggleStyleProps>(
        {
          size,
          checked: hookToForm && name ? formCheckedStatus : checked,
          disabled,
          className,
        },
        ComponentType.Toggle,
      )}
    >
      <input
        type="checkbox"
        {...params}
        {...(formFieldContext && {
          ...formFieldContext,
          onChange: async (e) => {
            setFormCheckedStatus(e.target.checked);
            formFieldContext.onChange(e);
            await params?.onChange?.(e);
          },
        })}
        className="toggle-input"
      />
      <div className="slider" />
      {/* TODO: display error when needed */}
      {/* {formFieldErrorMessage && <p className='error'>{formFieldErrorMessage}</p>} */}
    </label>
  );
};
