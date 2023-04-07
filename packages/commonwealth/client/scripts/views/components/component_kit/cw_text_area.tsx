import React from 'react';

import { redraw } from 'mithrilInterop';

import 'components/component_kit/cw_text_area.scss';

import { ComponentType } from './types';
import { getClasses } from './helpers';
import type { ValidationStatus } from './cw_validation_text';
import { MessageRow, useTextInputWithValidation } from './cw_text_input';
import type { BaseTextInputProps } from './cw_text_input';

type TextAreaStyleProps = {
  disabled?: boolean;
  validationStatus?: ValidationStatus;
};

type TextAreaProps = BaseTextInputProps & TextAreaStyleProps;

export const CWTextArea = (props: TextAreaProps) => {
  const validationProps = useTextInputWithValidation();

  const {
    autoComplete,
    autoFocus,
    value,
    disabled,
    inputValidationFn,
    label,
    maxLength,
    name,
    onInput,
    placeholder,
    tabIndex,
  } = props;

  return (
    <div className={ComponentType.TextArea}>
      {label && (
        <MessageRow
          hasFeedback={!!inputValidationFn}
          label={label}
          statusMessage={validationProps.statusMessage}
          validationStatus={validationProps.validationStatus}
        />
      )}
      <textarea
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        className={getClasses<TextAreaStyleProps & { isTyping: boolean }>({
          validationStatus: validationProps.validationStatus,
          disabled,
          isTyping: validationProps.isTyping,
        })}
        disabled={disabled}
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
            redraw();
          } else {
            e.stopPropagation();
            validationProps.setIsTyping(true);
            clearTimeout(validationProps.inputTimeout);
            const timeout = e.currentTarget.value?.length > 3 ? 250 : 1000;
            validationProps.setInputTimeout(
              setTimeout(() => {
                validationProps.setIsTyping(false);
                if (
                  inputValidationFn &&
                  e.currentTarget.value &&
                  e.currentTarget.value.length > 3
                ) {
                  const result = inputValidationFn(e.currentTarget.value);
                  validationProps.setValidationStatus(result[0]);
                  validationProps.setStatusMessage(result[1]);
                  redraw();
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
              redraw();
            } else {
              const result = inputValidationFn(e.currentTarget.value);
              validationProps.setValidationStatus(result[0]);
              validationProps.setStatusMessage(result[1]);
            }
          }
        }}
        value={value}
      />
    </div>
  );
};
