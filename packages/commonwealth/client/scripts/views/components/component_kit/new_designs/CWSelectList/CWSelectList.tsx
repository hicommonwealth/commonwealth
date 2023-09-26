import React from 'react';
import { useFormContext } from 'react-hook-form';
import type { GroupBase, Props } from 'react-select';
import Select, { components } from 'react-select';
import { CWIcon } from '../../cw_icons/cw_icon';
import { getClasses } from '../../helpers';
import { ComponentType } from '../../types';
import { MessageRow } from '../CWTextInput/MessageRow';
import './CWSelectList.scss';

type CustomCWSelectListProps = {
  label?: string;
  hookToForm?: boolean;
  customError?: string;
};

export const CWSelectList = <
  Option,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>
>(
  props: Props<Option, IsMulti, Group> & CustomCWSelectListProps
) => {
  const formContext = useFormContext();
  const formFieldContext = props.hookToForm
    ? formContext.register(props.name)
    : ({} as any);
  const formFieldErrorMessage =
    props.hookToForm &&
    (formContext?.formState?.errors?.[props.name]?.message as string);
  const defaultFormContextValue = props.hookToForm
    ? formContext?.getValues?.(props?.name)
    : null;

  return (
    <div>
      {props.label && <MessageRow label={props.label} />}
      <Select
        {...props}
        {...formFieldContext}
        {...(defaultFormContextValue && { value: defaultFormContextValue })}
        isDisabled={props?.isDisabled || formFieldContext?.disabled}
        required={props?.required || formFieldContext?.required}
        onBlur={(e) => {
          props?.onBlur?.(e);
          formFieldContext?.onBlur?.(e);
        }}
        onChange={(newValue: any, actionMeta) => {
          props?.onChange?.(newValue, actionMeta);
          if (props.hookToForm) {
            formContext.setValue(props.name, newValue);
            newValue?.length && formContext.setError(props.name, null);
          }
        }}
        styles={{
          control: (baseStyles) => ({
            ...baseStyles,
            // removes unnecessary styles
            border: 0,
            boxShadow: 'none',
            minHeight: 'unset',
          }),
          menu: (baseStyles) => ({
            ...baseStyles,
            maxHeight: '300px',
          }),
          option: (baseStyles, state) => {
            const base = { ...baseStyles };

            if (state.isSelected) {
              base.backgroundColor = '#F0EFF0 !important';
              base.color = 'inherit';
            }

            return base;
          },
        }}
        components={{
          DropdownIndicator: () => (
            <CWIcon
              className="caret-icon"
              iconName="caretDown"
              iconSize="small"
            />
          ),
          MultiValueRemove: (removeProps) => (
            <components.MultiValueRemove {...removeProps}>
              <CWIcon iconName="close" className="close-btn" />
            </components.MultiValueRemove>
          ),
        }}
        className={getClasses<{
          className?: string;
          failure?: boolean;
        }>(
          {
            className: props.className,
            failure: !!formFieldErrorMessage || !!props.customError,
          },
          ComponentType.SelectList
        )}
      />
      {(formFieldErrorMessage || props.customError) && (
        <MessageRow
          hasFeedback={!!formFieldErrorMessage || !!props.customError}
          statusMessage={formFieldErrorMessage || props.customError}
          validationStatus={
            formFieldErrorMessage || props.customError ? 'failure' : undefined
          }
        />
      )}
    </div>
  );
};
