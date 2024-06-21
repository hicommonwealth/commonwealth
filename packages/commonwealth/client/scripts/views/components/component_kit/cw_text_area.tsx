import React, { useEffect, useRef } from 'react';

import 'components/component_kit/cw_text_area.scss';

import { useFormContext } from 'react-hook-form';
import type { BaseTextInputProps } from './cw_text_input';
import { MessageRow, useTextInputWithValidation } from './cw_text_input';
import type { ValidationStatus } from './cw_validation_text';
import { getClasses } from './helpers';
import { MessageRow as NewMessageRow } from './new_designs/CWTextInput/MessageRow';
import { ComponentType } from './types';

type TextAreaStyleProps = {
  disabled?: boolean;
  validationStatus?: ValidationStatus;
  instructionalMessage?: string;
  resizeWithText?: boolean;
};

type TextAreaFormValidationProps = {
  name?: string;
  hookToForm?: boolean;
};

type TextAreaProps = BaseTextInputProps &
  TextAreaStyleProps &
  TextAreaFormValidationProps;

export const CWTextArea = (props: TextAreaProps) => {
  const validationProps = useTextInputWithValidation();
  const textareaRef = useRef(null);

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
    resizeWithText = false,
    hookToForm,
    instructionalMessage,
  } = props;

  useEffect(() => {
    if (resizeWithText) {
      // @ts-expect-error <StrictNullChecks/>
      textareaRef.current.style.height = 'auto';
      // @ts-expect-error <StrictNullChecks/>
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      // @ts-expect-error <StrictNullChecks/>
      textareaRef.current.style.minHeight = '152px';
      // @ts-expect-error <StrictNullChecks/>
      textareaRef.current.style.maxHeight = '512px';
    }
  }, [value, resizeWithText]);

  const formContext = useFormContext();
  const formFieldContext = hookToForm
    ? // @ts-expect-error <StrictNullChecks/>
      formContext.register(name)
    : ({} as any);
  const formFieldErrorMessage =
    // @ts-expect-error <StrictNullChecks/>
    hookToForm && (formContext?.formState?.errors?.[name]?.message as string);

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
          validationStatus:
            validationProps.validationStatus ||
            (formFieldErrorMessage ? 'failure' : undefined),
          disabled,
          isTyping: validationProps.isTyping,
        })}
        disabled={disabled}
        tabIndex={tabIndex}
        maxLength={maxLength}
        name={name}
        placeholder={placeholder}
        ref={textareaRef}
        value={value}
        {...formFieldContext}
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
                if (inputValidationFn && e.currentTarget.value.length > 3) {
                  const result = inputValidationFn(e.currentTarget.value);
                  validationProps.setValidationStatus(result[0]);
                  validationProps.setStatusMessage(result[1]);
                }
              }, timeout),
            );
          }
        }}
        onBlur={(e) => {
          if (hookToForm) formFieldContext?.onBlur?.(e);

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
      />
      {label && (
        <NewMessageRow
          instructionalMessage={instructionalMessage}
          statusMessage={validationProps.statusMessage}
          validationStatus={validationProps.validationStatus}
        />
      )}
      {label && (
        <NewMessageRow
          hasFeedback={!!inputValidationFn || !!formFieldErrorMessage}
          // @ts-expect-error <StrictNullChecks/>
          statusMessage={validationProps.statusMessage || formFieldErrorMessage}
          validationStatus={
            validationProps.validationStatus ||
            (formFieldErrorMessage ? 'failure' : undefined)
          }
        />
      )}
    </div>
  );
};
