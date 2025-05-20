import React from 'react';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { SpecialCaseDynamicFieldsProps } from './types';

const BasicPointsInput = ({
  defaultValues,
  errors,
  onChange,
  config,
}: SpecialCaseDynamicFieldsProps) => {
  // only render if config allows
  if (!config?.requires_basic_points) return <></>;

  return (
    <CWTextInput
      label="Total Reward Points"
      placeholder="Points Earned"
      fullWidth
      {...(defaultValues?.rewardAmount && {
        defaultValue: defaultValues?.rewardAmount,
      })}
      onInput={(e) => onChange?.({ rewardAmount: e?.target?.value?.trim() })}
      name="rewardAmount"
      customError={errors?.rewardAmount}
      containerClassName={config?.requires_creator_points ? 'span-3' : 'span-6'}
    />
  );
};

export default BasicPointsInput;
