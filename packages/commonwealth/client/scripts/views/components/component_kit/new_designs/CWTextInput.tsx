import React, { FC } from 'react';
import { CheckCircle, Warning } from '@phosphor-icons/react';

import 'components/component_kit/new_designs/CWTextInput.scss';
import { CWLabel } from '../cw_label';
import { CWText } from '../cw_text';
import type { ValidationStatus } from '../cw_validation_text';
import { getClasses } from '../helpers';

import { ComponentType } from '../types';

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
  manualValidationStatus?: ValidationStatus;
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
  isTyping?: boolean;
};

type TextInputProps = BaseTextInputProps &
  InputStyleProps &
  InputInternalStyleProps &
  React.HTMLAttributes<HTMLDivElement>;

type MessageRowProps = {
  hasFeedback?: boolean;
  label?: string | React.ReactNode;
  statusMessage?: string;
  validationStatus?: ValidationStatus;
  instructionalMessage?: string;
};

export const MessageRow: FC<MessageRowProps> = ({
  hasFeedback,
  label,
  statusMessage,
  validationStatus,
  instructionalMessage,
}) => {
  return (
    <div className={getClasses({}, 'MessageRow')}>
      {label && <CWLabel label={label} />}
      {instructionalMessage && <CWLabel label={instructionalMessage} />}
      {hasFeedback && (
        <>
          <div className={getClasses({ validationStatus }, 'icon')}>
            {validationStatus === 'success' && <CheckCircle weight="fill" />}
            {validationStatus === 'failure' && <Warning weight="fill" />}
          </div>
          <CWText
            type="caption"
            className={getClasses<{ status: ValidationStatus }>(
              { status: validationStatus },
              'feedback-message-text'
            )}
          >
            {statusMessage}
          </CWText>
        </>
      )}
    </div>
  );
};

export const useTextInputWithValidation = () => {
  const [inputTimeout, setInputTimeout] = React.useState<
    NodeJS.Timeout | undefined
  >();
  const [isTyping, setIsTyping] = React.useState<boolean>(false);
  const [statusMessage, setStatusMessage] = React.useState<
    string | undefined
  >();
  const [validationStatus, setValidationStatus] = React.useState<
    ValidationStatus | undefined
  >();

  return {
    inputTimeout,
    setInputTimeout,
    isTyping,
    setIsTyping,
    statusMessage,
    setStatusMessage,
    validationStatus,
    setValidationStatus,
  };
};

export const CWTextInput = (props: TextInputProps) => {
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
    manualValidationStatus = '',
    instructionalMessage,
  } = props;

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
          validationStatus={
            manualValidationStatus || validationProps.validationStatus
          }
        />
      )}
      <div className={getClasses({ fullWidth }, 'input-and-icon-container')}>
        {iconLeftonClick && iconLeft ? (
          <div className="text-input-left-onClick-icon">{iconLeft}</div>
        ) : iconLeft ? (
          <div className="text-input-left-icon">{iconLeft}</div>
        ) : null}
        <input
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          className={getClasses<InputStyleProps & InputInternalStyleProps>({
            size: isCompact ? 'small' : 'large',
            fullWidth,
            validationStatus: validationProps.validationStatus,
            disabled,
            displayOnly,
            isTyping: validationProps.isTyping,
            hasLeftIcon: !!iconLeft,
            hasRightIcon: !!iconRight,
            darkMode,
            inputClassName,
          })}
          disabled={disabled || displayOnly}
          tabIndex={tabIndex}
          maxLength={maxLength}
          name={name}
          placeholder={placeholder}
          onInput={(e) => {
            if (onInput) onInput(e);

            if (e.currentTarget.value?.length === 0) {
              validationProps.setIsTyping(false);
              validationProps.setValidationStatus(undefined);
              validationProps.setStatusMessage(undefined);
            } else {
              e.stopPropagation();
              validationProps.setIsTyping(true);
              clearTimeout(validationProps.inputTimeout);
              const timeout = e.currentTarget.value?.length > 3 ? 250 : 1000;
              validationProps.setInputTimeout(
                setTimeout(() => {
                  validationProps.setIsTyping(false);
                  if (inputValidationFn && e.currentTarget.value?.length > 3) {
                    const result = inputValidationFn(e.currentTarget.value);
                    validationProps.setValidationStatus(result[0]);
                    validationProps.setStatusMessage(result[1]);
                  }
                }, timeout)
              );
            }
          }}
          onBlur={(e) => {
            if (inputValidationFn) {
              if (e.target.value?.length === 0) {
                validationProps.setIsTyping(false);
                validationProps.setValidationStatus(undefined);
                validationProps.setStatusMessage(undefined);
              } else {
                const result = inputValidationFn(e.currentTarget.value);
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
          validationStatus={
            manualValidationStatus || validationProps.validationStatus
          }
        />
      )}
      {label && (
        <MessageRow
          hasFeedback={!!inputValidationFn}
          statusMessage={manualStatusMessage || validationProps.statusMessage}
          validationStatus={
            manualValidationStatus || validationProps.validationStatus
          }
        />
      )}
    </div>
  );
};
