import React, { useState } from 'react';
import DatePicker, { DatePickerProps } from 'react-datepicker';

import clsx from 'clsx';
import 'react-datepicker/dist/react-datepicker.css';
import { useFormContext } from 'react-hook-form';
import { CWIcon } from '../cw_icons/cw_icon';
import { TextInputSize } from '../new_designs/CWTextInput/CWTextInput';
import { MessageRow } from '../new_designs/CWTextInput/MessageRow';
import './CWDateTimeInput.scss';

type CWDateTimeInputProps = DatePickerProps & {
  name?: string;
  hookToForm?: boolean;
  containerClassName?: string;
  customError?: string;
  fullWidth?: boolean;
  size?: TextInputSize;
  label?: string;
};

// Notes:
// - In case of form validation
//   - only date selection (without time) is supported, other things like range
//     selection and multi value selection is not supported
//   - dates are in ISO formats
export const CWDateTimeInput = ({
  hookToForm,
  name,
  containerClassName,
  customError,
  fullWidth,
  size = 'large',
  label,
  ...datePickerProps
}: CWDateTimeInputProps) => {
  const [startDate, setStartDate] = useState<Date | null>(
    datePickerProps.selected || new Date(),
  );

  const formContext = useFormContext();
  const isHookedToForm = hookToForm && name;
  const formFieldContext = isHookedToForm ? formContext.register(name) : null;
  const formFieldErrorMessage =
    isHookedToForm &&
    (formContext?.formState?.errors?.[name]?.message as string);

  return (
    <div
      className={clsx('CWDateTimeInput', containerClassName, size, {
        fullWidth,
        error: !!formFieldErrorMessage,
      })}
    >
      {label && <MessageRow label={label} />}
      <DatePicker
        closeOnScroll
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...(datePickerProps as any)} // Note: internal component type isn't correctly defined
        calendarClassName="calender"
        selected={startDate}
        icon={<CWIcon iconName="caretLeft" />}
        {...(formFieldContext
          ? {
              ...formFieldContext,
              onBlur: (e) => {
                formFieldContext.onBlur(e);
                datePickerProps?.onBlur?.(e);
              },
              onChange: (value, event) => {
                setStartDate(value);
                event && formFieldContext.onChange(event);
                isHookedToForm &&
                  formContext.setValue(
                    name,
                    value ? value.toISOString() : null,
                  );
                (
                  datePickerProps?.onChange as (
                    date: Date | null,
                    event?:
                      | React.MouseEvent<HTMLElement>
                      | React.KeyboardEvent<HTMLElement>,
                  ) => void
                )?.(value, event);
              },
            }
          : {
              onChange: (value, event) => {
                setStartDate(value);
                (
                  datePickerProps?.onChange as (
                    date: Date | null,
                    event?:
                      | React.MouseEvent<HTMLElement>
                      | React.KeyboardEvent<HTMLElement>,
                  ) => void
                )?.(value, event);
              },
            })}
      />
      <MessageRow
        hasFeedback={!!formFieldErrorMessage || !!customError}
        statusMessage={formFieldErrorMessage || customError}
        validationStatus={
          formFieldErrorMessage || customError ? 'failure' : undefined
        }
      />
    </div>
  );
};
