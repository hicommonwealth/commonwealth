import React from 'react';

import 'components/component_kit/cw_text_input.scss';
import { CWIconButton } from './cw_icon_button';
import { CWIcon } from './cw_icons/cw_icon';
import type { IconName } from './cw_icons/cw_icon_lookup';
import { CWLabel } from './cw_label';
import { CWText } from './cw_text';
import type { ValidationStatus } from './cw_validation_text';
import { getClasses } from './helpers';

import { ComponentType } from './types';

type TextInputSize = 'small' | 'large';

export type BaseTextInputProps = {
  autoComplete?: string;
  autoFocus?: boolean;
  containerClassName?: string;
  defaultValue?: string | number;
  value?: string | number;
  iconRight?: IconName;
  iconRightonClick?: () => void;
  inputValidationFn?: (value: string) => [ValidationStatus, string] | [];
  label?: string | React.ReactNode;
  maxLength?: number;
  name?: string;
  onInput?: (e) => void;
  onenterkey?: (e) => void;
  onClick?: (e) => void;
  placeholder?: string;
  tabIndex?: number;
  manualStatusMessage?: string;
  manualValidationStatus?: ValidationStatus;
};

type InputStyleProps = {
  inputClassName?: string;
  darkMode?: boolean;
  disabled?: boolean;
  size?: TextInputSize;
  validationStatus?: ValidationStatus;
  displayOnly?: boolean;
};

type InputInternalStyleProps = {
  hasRightIcon?: boolean;
  isTyping?: boolean;
};

type MessageRowProps = {
  hasFeedback?: boolean;
  label: string | React.ReactNode;
  statusMessage?: string;
  validationStatus?: ValidationStatus;
};

type TextInputProps = BaseTextInputProps &
  InputStyleProps &
  InputInternalStyleProps &
  React.HTMLAttributes<HTMLDivElement>;

export const MessageRow = (props: MessageRowProps) => {
  const { hasFeedback, label, statusMessage, validationStatus } = props;

  return (
    <div
      className={getClasses<{ hasFeedback: boolean }>(
        { hasFeedback },
        'MessageRow',
      )}
    >
      <CWLabel label={label} />
      {hasFeedback && (
        <CWText
          type="caption"
          className={getClasses<{ status: ValidationStatus }>(
            { status: validationStatus },
            'feedback-message-text',
          )}
        >
          {statusMessage}
        </CWText>
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

export const CWTextInput = ({
  autoComplete = 'off',
  autoFocus,
  containerClassName,
  darkMode,
  defaultValue,
  value,
  disabled,
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
  size = 'large',
  tabIndex,
  displayOnly,
  manualStatusMessage = '',
  manualValidationStatus,
  validationStatus,
}: TextInputProps) => {
  const validationProps = useTextInputWithValidation();

  return (
    <div
      className={getClasses<{
        containerClassName?: string;
        validationStatus?: ValidationStatus;
      }>(
        {
          containerClassName,
          validationStatus,
        },
        ComponentType.OldTextInput,
      )}
      onClick={onClick}
    >
      {label && (
        <MessageRow
          hasFeedback={!!inputValidationFn}
          label={label}
          statusMessage={manualStatusMessage || validationProps.statusMessage}
          validationStatus={
            manualValidationStatus || validationProps.validationStatus
          }
        />
      )}
      <div className="input-and-icon-container">
        <input
          id={label + 'Input'}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          className={getClasses<InputStyleProps & InputInternalStyleProps>({
            size,
            validationStatus: validationProps.validationStatus,
            disabled,
            displayOnly,
            isTyping: validationProps.isTyping,
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
                  if (inputValidationFn && e.currentTarget?.value?.length > 3) {
                    const result = inputValidationFn(e.currentTarget?.value);
                    validationProps.setValidationStatus(result[0]);
                    validationProps.setStatusMessage(result[1]);
                  }
                }, timeout),
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
        {iconRightonClick && !!iconRight && !disabled ? (
          <div className="text-input-right-onClick-icon">
            <CWIconButton
              iconName={iconRight}
              iconSize="small"
              onClick={iconRightonClick}
            />
          </div>
        ) : !!iconRight && !disabled ? (
          <CWIcon
            iconName={iconRight}
            iconSize="small"
            className="text-input-right-icon"
          />
        ) : null}
      </div>
    </div>
  );
};
