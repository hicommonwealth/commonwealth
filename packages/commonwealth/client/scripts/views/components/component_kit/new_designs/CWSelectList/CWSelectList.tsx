import './CWSelectList.scss';
import React, { useEffect } from 'react';
import type { GroupBase, Props } from 'react-select';
import Select, { components } from 'react-select';
import { CWIcon } from '../../cw_icons/cw_icon';
import { getClasses } from '../../helpers';
import { ComponentType } from '../../types';
import { MessageRow } from '../CWTextInput/MessageRow';
import { useFormContext } from 'react-hook-form';

type CustomCWSelectListProps = {
  label?: string;
  hookToForm?: boolean;
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
            failure: !!formFieldErrorMessage,
          },
          ComponentType.SelectList
        )}
      />
      {formFieldErrorMessage && (
        <MessageRow
          hasFeedback={!!formFieldErrorMessage}
          statusMessage={formFieldErrorMessage}
          validationStatus={formFieldErrorMessage ? 'failure' : undefined}
        />
      )}
    </div>
  );
};
