import { CommunityGoalTypes } from '@hicommonwealth/shared';
import { capitalize } from 'lodash';
import React from 'react';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { SpecialCaseDynamicFieldsProps } from './types';

const CommunityGoals = ({
  defaultValues,
  errors,
  onChange,
  config,
}: SpecialCaseDynamicFieldsProps) => {
  // only render if config allows
  if (!config?.requires_goal_config) return <></>;

  const goalTypeOptions = CommunityGoalTypes.map((goal) => ({
    value: goal as string,
    label: capitalize(goal),
  }))?.sort((a, b) => a.label.localeCompare(b.label));

  return (
    <>
      <CWSelectList
        key={`goalType-${defaultValues?.action}`}
        name="goalType"
        isClearable={false}
        label="Goal Type"
        placeholder="Select a goal type"
        options={goalTypeOptions}
        onChange={(newValue) =>
          newValue && onChange?.({ goalType: `${newValue.value}` })
        }
        {...(defaultValues?.goalType && {
          value: {
            value: defaultValues?.goalType,
            label: goalTypeOptions?.find(
              (x) => x.value === defaultValues?.goalType,
            )?.label,
          },
        })}
        customError={errors?.goalType}
        containerClassname="span-3" // this layout comes from QuestActionSubForm.scss
      />
      <CWTextInput
        key={`goalTarget-${defaultValues?.action}`}
        name="goalTarget"
        label={`Target Count${defaultValues?.goalType ? ` (${defaultValues?.goalType})` : ''}`}
        placeholder="100"
        fullWidth
        {...(defaultValues?.goalTarget && {
          defaultValue: defaultValues?.goalTarget,
        })}
        onInput={(e) => onChange?.({ goalTarget: e?.target?.value?.trim() })}
        customError={errors?.goalTarget}
        containerClassName="span-3" // this layout comes from QuestActionSubForm.scss
      />
    </>
  );
};

export default CommunityGoals;
