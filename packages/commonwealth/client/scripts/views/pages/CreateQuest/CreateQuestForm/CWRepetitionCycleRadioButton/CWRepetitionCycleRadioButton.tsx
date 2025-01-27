import clsx from 'clsx';
import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { CWRadioButton } from 'views/components/component_kit/new_designs/cw_radio_button';
import './CWRepetitionCycleRadioButton.scss';
import { CWRepetitionCycleRadioButtonProps } from './types';

const CWRepetitionCycleRadioButton = ({
  repetitionCycleSelectListProps,
  repetitionCycleInputProps,
  ...radioButtonProps
}: CWRepetitionCycleRadioButtonProps) => {
  const RepetitionCycleLabel = (
    <span
      className={clsx('repetition-cycle-label', {
        hasInputError: repetitionCycleInputProps?.hasError,
        hasSelectError: repetitionCycleSelectListProps.hasError,
      })}
    >
      <CWText type="b2">Repeatable</CWText>
      <CWTextInput
        //  Note: can be hooked to form validation, but errors need to be displayed seperately (unhandled)
        type="number"
        size="small"
        value={repetitionCycleInputProps?.value}
        placeholder={repetitionCycleInputProps?.placeholder}
        disabled={repetitionCycleInputProps?.isDisabled}
        onInput={(e) => repetitionCycleInputProps?.onChange?.(e.target.value)}
        onBlur={repetitionCycleInputProps.onBlur}
      />
      <CWText type="b2">
        time
        {parseInt(`${repetitionCycleInputProps?.value || 0}`) > 1 ? 's' : ''}
      </CWText>
      <div>
        <CWSelectList
          //  Note: can be hooked to form validation, but errors need to be displayed seperately (unhandled)
          isSearchable={false}
          isClearable={false}
          isDisabled={repetitionCycleSelectListProps.isDisabled}
          options={repetitionCycleSelectListProps.options}
          value={repetitionCycleSelectListProps.selected}
          placeholder={repetitionCycleSelectListProps.placeholder}
          onChange={repetitionCycleSelectListProps.onChange}
        />
      </div>
    </span>
  );

  return (
    <CWRadioButton
      {...radioButtonProps}
      className={clsx(
        'CWRepetitionCycleRadioButton',
        radioButtonProps.className,
      )}
      label={RepetitionCycleLabel}
    />
  );
};

export default CWRepetitionCycleRadioButton;
