import {
  QuestParticipationLimit,
  QuestParticipationPeriod,
} from '@hicommonwealth/schemas';
import { numberNonDecimalGTZeroValidationSchema } from 'helpers/formValidations/common';
import { splitCamelOrPascalCase } from 'helpers/string';
import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import { useEffect } from 'react';
import { useCWRepetitionCycleRadioButton } from 'views/components/component_kit/CWRepetitionCycleRadioButton';
import { ValidationFnProps } from 'views/components/component_kit/CWRepetitionCycleRadioButton/types';
import { doesConfigAllowContentIdField } from '../helpers';
import { QuestAction, QuestActionSubFormProps } from './types';

// these restrictions are only on client side, update per future requirements
const MAX_REPETITION_COUNTS = {
  PER_DAY: 4,
  PER_WEEK: 28,
  PER_MONTH: 120,
};

const useQuestActionSubForm = ({
  defaultValues,
  config,
  onChange,
  availableActions,
  hiddenActions,
  internalRefs,
}: QuestActionSubFormProps) => {
  const actionOptions = availableActions
    .map((event) => ({
      value: event as QuestAction,
      label: splitCamelOrPascalCase(event),
    }))
    .filter((action) => !(hiddenActions || []).includes(action.value));

  const hasContentIdField = config
    ? doesConfigAllowContentIdField(config)
    : false;

  const repetitionCycleOptions = Object.keys(QuestParticipationPeriod).map(
    (k) => ({
      label: k,
      value: QuestParticipationPeriod[k],
    }),
  );

  const repetitionCycleValidatorFn = (props: ValidationFnProps) => {
    const participation_limit = defaultValues?.participationLimit;
    const { input, selectList } = props.values;

    // clear errors if participation timeline is not a repeatable
    if (participation_limit !== QuestParticipationLimit.OncePerPeriod) {
      return { error: undefined };
    }

    // validate repetition cycle value
    if (
      !Object.values(QuestParticipationPeriod).includes(
        selectList?.value as QuestParticipationPeriod,
      )
    ) {
      return { error: 'Invalid value for reptition cycle' };
    }

    // validate repetition count value
    try {
      numberNonDecimalGTZeroValidationSchema.parse(`${input}`);

      const count = parseInt(`${input}`);

      // verify repetition counts fall within a certain range
      if (
        (selectList?.value === QuestParticipationPeriod.Daily &&
          count > MAX_REPETITION_COUNTS.PER_DAY) ||
        (selectList?.value === QuestParticipationPeriod.Weekly &&
          count > MAX_REPETITION_COUNTS.PER_WEEK) ||
        (selectList?.value === QuestParticipationPeriod.Monthly &&
          count > MAX_REPETITION_COUNTS.PER_MONTH)
      ) {
        const allowedCount =
          selectList?.value === QuestParticipationPeriod.Daily
            ? MAX_REPETITION_COUNTS.PER_DAY
            : selectList?.value === QuestParticipationPeriod.Weekly
              ? MAX_REPETITION_COUNTS.PER_WEEK
              : MAX_REPETITION_COUNTS.PER_MONTH;
        return {
          error: `Cannot repeat more than ${allowedCount} times ${selectList?.value}`,
        };
      }
    } catch {
      return { error: 'Invalid value for repetition count' };
    }

    return { error: undefined };
  };

  const {
    error: repetitionCycleRadioError,
    triggerValidation: triggerRepetitionCycleRadioValidation,
    ...repetitionCycleRadioProps
  } = useCWRepetitionCycleRadioButton({
    validatorFn: repetitionCycleValidatorFn,
    repetitionCycleInputProps: {
      value: 1,
    },
    repetitionCycleSelectListProps: {
      options: repetitionCycleOptions,
      selected: repetitionCycleOptions[0],
    },
  });

  const repetitionCycleRadio = {
    error: repetitionCycleRadioError,
    triggerValidation: triggerRepetitionCycleRadioValidation,
    props: {
      repetitionCycleInputProps: {
        ...repetitionCycleRadioProps.repetitionCycleInputProps,
      },
      repetitionCycleSelectListProps: {
        ...repetitionCycleRadioProps.repetitionCycleSelectListProps,
      },
    },
  };

  if (internalRefs) {
    internalRefs.runParticipationLimitValidator =
      triggerRepetitionCycleRadioValidation;
  }

  useRunOnceOnCondition({
    callback: () => {
      if (
        defaultValues?.participationTimesPerPeriod ||
        defaultValues?.participationPeriod
      ) {
        defaultValues?.participationTimesPerPeriod &&
          repetitionCycleRadioProps.repetitionCycleInputProps.onChange(
            defaultValues?.participationTimesPerPeriod,
          );
        defaultValues?.participationPeriod &&
          repetitionCycleRadioProps.repetitionCycleSelectListProps.onChange({
            value: defaultValues?.participationPeriod,
            label:
              Object.entries(QuestParticipationPeriod).find(
                ([_, v]) => v === defaultValues?.participationPeriod,
              )?.[0] || '',
          });
      }
    },
    shouldRun: true,
  });

  const participationTimesPerPeriod =
    repetitionCycleRadioProps.repetitionCycleInputProps.value;
  useEffect(() => {
    if (
      participationTimesPerPeriod === defaultValues?.participationTimesPerPeriod
    )
      return;
    onChange?.({
      participationTimesPerPeriod: participationTimesPerPeriod,
    });
  }, [
    participationTimesPerPeriod,
    defaultValues?.participationTimesPerPeriod,
    onChange,
  ]);

  const participationPeriod = repetitionCycleRadioProps
    .repetitionCycleSelectListProps.selected?.value as QuestParticipationPeriod;
  useEffect(() => {
    if (participationPeriod === defaultValues?.participationPeriod) return;
    onChange?.({
      participationPeriod: participationPeriod,
    });
  }, [participationPeriod, defaultValues?.participationPeriod, onChange]);

  const doesActionPreventRepetition =
    typeof config?.is_action_repeatable !== 'undefined'
      ? !config?.is_action_repeatable
      : false;

  return {
    doesActionPreventRepetition,
    repetitionCycleRadio,
    actionOptions,
    hasContentIdField,
  };
};

export default useQuestActionSubForm;
