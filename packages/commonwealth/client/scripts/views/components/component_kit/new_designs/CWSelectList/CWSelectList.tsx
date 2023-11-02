import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import type { GroupBase, Props } from 'react-select';
import Select from 'react-select';
import { getClasses } from '../../helpers';
import { ComponentType } from '../../types';
import { MessageRow } from '../CWTextInput/MessageRow';
import './CWSelectList.scss';
import { DropdownIndicator } from './DropdownIndicator';
import { MultiValueRemove } from './MultiValueRemove';
import { Option } from './Option';

type CustomCWSelectListProps = {
  label?: string;
  hookToForm?: boolean;
  customError?: string;
};

export const CWSelectList = <
  Option,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
>(
  props: Props<Option, IsMulti, Group> & CustomCWSelectListProps,
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

  useEffect(() => {
    props.hookToForm &&
      formContext &&
      props.name &&
      props.defaultValue &&
      formContext.setValue(props.name, props.defaultValue);
  }, [props.hookToForm, props.name, props.defaultValue, formContext]);

  useEffect(() => {
    props.hookToForm &&
      formContext &&
      props.name &&
      props.value &&
      formContext.setValue(props.name, props.value);
  }, [props.hookToForm, props.name, props.value, formContext]);

  return (
    <div className="CWSelectList">
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
        }}
        components={{
          DropdownIndicator,
          MultiValueRemove,
          Option,
        }}
        className={getClasses<{
          className?: string;
          failure?: boolean;
          searchable?: boolean;
        }>(
          {
            className: props.className,
            failure: !!formFieldErrorMessage || !!props.customError,
            searchable: props.isSearchable,
          },
          ComponentType.SelectList,
        )}
        classNamePrefix={props.classNamePrefix || 'cwsl'}
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
