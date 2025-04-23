import { doesActionRewardShareForReferrer } from 'helpers/quest';
import React from 'react';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { QuestAction } from '../types';
import { SpecialCaseDynamicFieldsProps } from './types';

const CreatorPointsInput = ({
  defaultValues,
  errors,
  onChange,
  config,
}: SpecialCaseDynamicFieldsProps) => {
  if (!config?.requires_creator_points) return <></>;

  const hasReferrerShare = doesActionRewardShareForReferrer(
    defaultValues?.action as QuestAction,
  );

  return (
    <CWTextInput
      label={`${hasReferrerShare ? 'Referrer' : 'Creater'} Reward Share`}
      placeholder="Points Earned"
      containerClassName="span-3"
      fullWidth
      {...(defaultValues?.creatorRewardAmount && {
        defaultValue: defaultValues?.creatorRewardAmount,
      })}
      onInput={(e) =>
        onChange?.({ creatorRewardAmount: e?.target?.value?.trim() })
      }
      name="creatorRewardAmount"
      customError={errors?.creatorRewardAmount}
      instructionalMessage={`Deducted from total reward points. ${
        hasReferrerShare ? 'Only applied for referred user.' : ''
      }`}
    />
  );
};

export default CreatorPointsInput;
