import React from 'react';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { SpecialCaseDynamicFieldsProps } from './types';

const AmountMultipler = ({
  defaultValues,
  errors,
  onChange,
  config,
}: SpecialCaseDynamicFieldsProps) => {
  if (!config?.requires_amount_multipler) return <></>;

  return (
    <CWTextInput
      label="Reward Points Multipler"
      name="amountMultipler"
      containerClassName="span-3"
      placeholder="0"
      fullWidth
      {...(defaultValues?.amountMultipler && {
        defaultValue: defaultValues?.amountMultipler,
      })}
      onInput={(e) => onChange?.({ amountMultipler: e?.target?.value?.trim() })}
      customError={errors?.amountMultipler}
      instructionalMessage='Users will receive "reward amount multipler * user eth trade amount" aura'
    />
  );
};

export default AmountMultipler;
