import React, { useEffect, useState } from 'react';
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
  const {
    hookToForm,
    name,
    defaultValue,
    label,
    value,
    className,
    classNamePrefix,
    isSearchable,
    customError,
    components,
  } = props;
  const formContext = useFormContext();
  const formFieldContext = hookToForm
    ? formContext.register(name)
    : ({} as any);
  const formFieldErrorMessage =
    hookToForm && (formContext?.formState?.errors?.[name]?.message as string);
  const [defaultFormContextValue, setDefaultFormContextValue] = useState(
    hookToForm ? formContext?.getValues?.(props?.name) : null,
  );

  useEffect(() => {
    if (defaultFormContextValue) {
      setTimeout(() => {
        setDefaultFormContextValue(null);
      });
    }
  }, [defaultFormContextValue]);

  useEffect(() => {
    hookToForm &&
      formContext &&
      name &&
      defaultValue &&
      formContext.setValue(name, defaultValue);
  }, [hookToForm, name, defaultValue, formContext]);

  useEffect(() => {
    hookToForm &&
      formContext &&
      name &&
      value &&
      formContext.setValue(name, value);
  }, [hookToForm, name, value, formContext]);

  const isDisabled = props?.isDisabled || formFieldContext?.disabled;

  return (
    <div
      className={getClasses<{ disabled?: boolean }>(
        { disabled: isDisabled },
        'CWSelectList',
      )}
    >
      {label && <MessageRow label={label} />}
      <Select
        {...props}
        {...formFieldContext}
        {...(defaultFormContextValue && { value: defaultFormContextValue })}
        isDisabled={isDisabled}
        required={props?.required || formFieldContext?.required}
        onBlur={(e) => {
          props?.onBlur?.(e);
          formFieldContext?.onBlur?.(e);
        }}
        onChange={(newValue: any, actionMeta) => {
          props?.onChange?.(newValue, actionMeta);
          if (hookToForm) {
            formContext.setValue(name, newValue);
            (newValue?.length ||
              (typeof newValue === 'object' &&
                Object.keys(newValue).length > 0)) &&
              formContext.setError(name, null);
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
          Option: components?.Option || Option,
        }}
        className={getClasses<{
          className?: string;
          failure?: boolean;
          disabled?: boolean;
          searchable?: boolean;
        }>(
          {
            className: className,
            failure: !!formFieldErrorMessage || !!customError,
            searchable: isSearchable,
            disabled: isDisabled,
          },
          ComponentType.SelectList,
        )}
        classNamePrefix={classNamePrefix || 'cwsl'}
      />
      {(formFieldErrorMessage || customError) && (
        <MessageRow
          hasFeedback={!!formFieldErrorMessage || !!customError}
          statusMessage={formFieldErrorMessage || customError}
          validationStatus={
            formFieldErrorMessage || customError ? 'failure' : undefined
          }
        />
      )}
    </div>
  );
};
