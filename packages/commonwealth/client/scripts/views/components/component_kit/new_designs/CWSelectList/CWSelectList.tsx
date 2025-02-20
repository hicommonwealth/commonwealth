import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import type { GroupBase, Props, SingleValueProps } from 'react-select';
import Select from 'react-select';
import { getClasses } from '../../helpers';
import { ComponentType } from '../../types';
import { CWSingleSelectItem } from '../CWSingleSelectItem/CWSingleSelectItem';
import { MessageRow } from '../CWTextInput/MessageRow';
import './CWSelectList.scss';
import { DropdownIndicator } from './DropdownIndicator';
import { MultiValueRemove } from './MultiValueRemove';
import { Option } from './Option';

type CustomCWSelectListProps = {
  label?: string;
  hookToForm?: boolean;
  customError?: string;
  // eslint-disable-next-line prettier/prettier
  saveToClipboard?: (
    id: string,
    successNotification?: boolean,
  ) => Promise<void>;
  showCopyIcon?: boolean;
  instructionalMessage?: string;
};

type OptionProps = {
  value: string;
  label: string;
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
    isMulti,
    showCopyIcon,
    saveToClipboard,
    instructionalMessage,
  } = props;
  const formContext = useFormContext();
  const isHookedToForm = hookToForm && name;
  const formFieldContext = isHookedToForm ? formContext.register(name) : null;
  const formFieldErrorMessage =
    isHookedToForm &&
    (formContext?.formState?.errors?.[name]?.message as string);
  const [defaultFormContextValue, setDefaultFormContextValue] = useState(
    isHookedToForm ? formContext?.getValues?.(name) : null,
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
    isHookedToForm && formContext && value && formContext.setValue(name, value);
  }, [isHookedToForm, name, value, formContext]);

  const isDisabled = props?.isDisabled || formFieldContext?.disabled;

  return (
    <div
      className={getClasses<{ disabled?: boolean }>(
        {
          disabled: isDisabled,
        },
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
          if (isHookedToForm) {
            formContext.setValue(name, newValue);
            (newValue?.length ||
              (typeof newValue === 'object' &&
                Object.keys(newValue).length > 0)) &&
              // @ts-expect-error <StrictNullChecks/>
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
          ...(showCopyIcon && {
            // eslint-disable-next-line react/no-multi-comp
            SingleValue: (singleValueProps: SingleValueProps<OptionProps>) => (
              <CWSingleSelectItem
                {...singleValueProps}
                showCopyIcon={showCopyIcon}
                saveToClipboard={saveToClipboard}
              />
            ),
          }),
        }}
        className={getClasses<{
          className?: string;
          failure?: boolean;
          disabled?: boolean;
          searchable?: boolean;
          isMulti?: boolean;
        }>(
          {
            className: className,
            failure: !!formFieldErrorMessage || !!customError,
            searchable: isSearchable,
            disabled: isDisabled,
            isMulti: isMulti,
          },
          ComponentType.SelectList,
        )}
        classNamePrefix={classNamePrefix || 'cwsl'}
      />
      {instructionalMessage && (
        <MessageRow instructionalMessage={instructionalMessage} />
      )}
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
