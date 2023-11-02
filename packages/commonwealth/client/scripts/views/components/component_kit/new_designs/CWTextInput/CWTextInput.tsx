import React from 'react';

import type { ValidationStatus } from '../../cw_validation_text';
import { MessageRow } from './MessageRow';
import { getClasses } from '../../helpers';
import { ComponentType } from '../../types';
import { useTextInputWithValidation } from './useTextInputWithValidation';
import { useFormContext } from 'react-hook-form';

import './CWTextInput.scss';

type TextInputSize = 'small' | 'large';

export type BaseTextInputProps = {
  autoComplete?: string;
  autoFocus?: boolean;
  containerClassName?: string;
  defaultValue?: string | number;
  value?: string | number;
  iconLeft?: JSX.Element;
  iconLeftonClick?: () => void;
  iconRight?: JSX.Element;
  iconRightonClick?: () => void;
  inputValidationFn?: (value: string) => [ValidationStatus, string] | [];
  label?: string | React.ReactNode;
  maxLength?: number;
  isCompact?: boolean;
  name?: string;
  onInput?: (e) => void;
  onenterkey?: (e) => void;
  onClick?: (e) => void;
  placeholder?: string;
  tabIndex?: number;
  instructionalMessage?: string;
  manualStatusMessage?: string;
};

type InputStyleProps = {
  inputClassName?: string;
  darkMode?: boolean;
  disabled?: boolean;
  size?: TextInputSize;
  fullWidth?: boolean;
  validationStatus?: ValidationStatus;
  displayOnly?: boolean;
};

type InputInternalStyleProps = {
  hasLeftIcon?: boolean;
  hasRightIcon?: boolean;
};

type InputFormValidationProps = {
  name?: string;
  hookToForm?: boolean;
  customError?: string;
};

type TextInputProps = BaseTextInputProps &
  InputStyleProps &
  InputInternalStyleProps &
  React.HTMLAttributes<HTMLDivElement> &
  InputFormValidationProps;

const CWTextInput = (props: TextInputProps) => {
  const validationProps = useTextInputWithValidation();

  const {
    autoComplete = 'off',
    autoFocus,
    containerClassName,
    darkMode,
    defaultValue,
    value,
    disabled,
    fullWidth,
    iconLeft,
    iconLeftonClick,
    iconRight,
    iconRightonClick,
    inputClassName,
    inputValidationFn,
    label,
    maxLength,
    name,
    onInput,
    onenterkey,
    onClick,
    placeholder,
    isCompact = false,
    tabIndex,
    displayOnly,
    manualStatusMessage = '',
    instructionalMessage,
    hookToForm,
    customError,
  } = props;

  const formContext = useFormContext();
  const formFieldContext = hookToForm
    ? formContext.register(name)
    : ({} as any);
  const formFieldErrorMessage =
    hookToForm && (formContext?.formState?.errors?.[name]?.message as string);

  return (
    <div
      className={getClasses<{
        containerClassName?: string;
        validationStatus?: ValidationStatus;
      }>(
        {
          containerClassName,
          validationStatus: props.validationStatus,
        },
        ComponentType.TextInput
      )}
      onClick={onClick}
    >
      {label && (
        <MessageRow
          label={label}
          statusMessage={manualStatusMessage || validationProps.statusMessage}
          validationStatus={validationProps.validationStatus}
        />
      )}
      <div className={getClasses({ fullWidth }, 'input-and-icon-container')}>
        {iconLeftonClick && iconLeft ? (
          <div className="text-input-left-onClick-icon">{iconLeft}</div>
        ) : iconLeft ? (
          <div className="text-input-left-icon">{iconLeft}</div>
        ) : null}
        <input
          {...formFieldContext}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          className={getClasses<InputStyleProps & InputInternalStyleProps>({
            size: isCompact ? 'small' : 'large',
            validationStatus:
              validationProps.validationStatus ||
              (formFieldErrorMessage || customError ? 'failure' : undefined),
            disabled,
            displayOnly,
            hasLeftIcon: !!iconLeft,
            hasRightIcon: !!iconRight,
            darkMode,
            inputClassName,
          })}
          disabled={disabled || displayOnly || formFieldContext?.disabled}
          tabIndex={tabIndex}
          maxLength={maxLength || formFieldContext?.maxLength}
          name={name}
          placeholder={placeholder}
          onInput={(e: any) => {
            if (onInput) onInput(e);

            if (e.target.value?.length === 0) {
              validationProps.setValidationStatus(undefined);
              validationProps.setStatusMessage(undefined);
            } else {
              e.stopPropagation();
              clearTimeout(validationProps.inputTimeout);
              const timeout = e.target.value?.length > 3 ? 250 : 1000;
              validationProps.setInputTimeout(
                setTimeout(() => {
                  if (inputValidationFn && e.target.value?.length > 3) {
                    const result = inputValidationFn(e.target.value);
                    validationProps.setValidationStatus(result[0]);
                    validationProps.setStatusMessage(result[1]);
                  }
                }, timeout)
              );
            }
          }}
          onBlur={(e) => {
            if (hookToForm) formFieldContext?.onBlur?.(e);

            if (inputValidationFn) {
              if (e.target.value?.length === 0) {
                validationProps.setValidationStatus(undefined);
                validationProps.setStatusMessage(undefined);
              } else {
                const result = inputValidationFn(e.target.value);
                validationProps.setValidationStatus(result[0]);
                validationProps.setStatusMessage(result[1]);
              }
            }
          }}
          onKeyDown={(e) => {
            if (onenterkey && (e.key === 'Enter' || e.keyCode === 13)) {
              onenterkey(e);
            }
          }}
          value={value}
          defaultValue={defaultValue}
        />
        {iconRightonClick && iconRight ? (
          <div className="text-input-right-onClick-icon">{iconRight}</div>
        ) : iconRight ? (
          <div className="text-input-right-icon">{iconRight}</div>
        ) : null}
      </div>
      {label && (
        <MessageRow
          instructionalMessage={instructionalMessage}
          statusMessage={manualStatusMessage || validationProps.statusMessage}
          validationStatus={validationProps.validationStatus}
        />
      )}
      {(label || customError) && (
        <MessageRow
          hasFeedback={
            !!inputValidationFn || !!formFieldErrorMessage || !!customError
          }
          statusMessage={
            manualStatusMessage ||
            validationProps.statusMessage ||
            formFieldErrorMessage ||
            customError
          }
          validationStatus={
            validationProps.validationStatus ||
            (formFieldErrorMessage || customError ? 'failure' : undefined)
          }
        />
      )}
    </div>
  );
};

export default CWTextInput;
