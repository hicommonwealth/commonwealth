import {
  QuestEvents,
  QuestParticipationLimit,
  QuestParticipationPeriod,
} from '@hicommonwealth/schemas';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { numberGTZeroValidationSchema } from 'helpers/formValidations/common';
import { calculateRemainingPercentageChangeFractional } from 'helpers/number';
import { useCommonNavigate } from 'navigation/helpers';
import { useRef, useState } from 'react';
import {
  useCreateQuestMutation,
  useUpdateQuestMutation,
} from 'state/api/quests';
import { useCWRepetitionCycleRadioButton } from 'views/components/component_kit/CWRepetitionCycleRadioButton';
import { ValidationFnProps } from 'views/components/component_kit/CWRepetitionCycleRadioButton/types';
import { CWFormRef } from 'views/components/component_kit/new_designs/CWForm';
import { z } from 'zod';
import { QuestAction } from './QuestActionSubForm';
import { useQuestActionMultiFormsState } from './QuestActionSubForm/useMultipleQuestActionForms';
import './QuestForm.scss';
import { questFormValidationSchema } from './validation';

const MIN_ACTIONS_LIMIT = 1;
const MAX_ACTIONS_LIMIT = Object.values(QuestEvents).length; // = 8 max actions
// these restrictions are only on client side, update per future requirements
const MAX_REPETITION_COUNTS = {
  PER_DAY: 4,
  PER_WEEK: 28,
  PER_MONTH: 120,
};

const useQuestForm = () => {
  const {
    addSubForm,
    questActionSubForms,
    removeSubFormByIndex,
    updateSubFormByIndex,
    validateSubForms,
  } = useQuestActionMultiFormsState({
    minSubForms: MIN_ACTIONS_LIMIT,
    maxSubForms: MAX_ACTIONS_LIMIT,
  });

  const minStartDate = new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000); // 1 day date in future

  const [isProcessingQuestImage, setIsProcessingQuestImage] = useState(false);

  const { mutateAsync: createQuest } = useCreateQuestMutation();
  const { mutateAsync: updateQuest } = useUpdateQuestMutation();

  const navigate = useCommonNavigate();

  const formMethodsRef = useRef<CWFormRef>(null);
  const repetitionCycleOptions = Object.keys(QuestParticipationPeriod).map(
    (k) => ({
      label: k,
      value: QuestParticipationPeriod[k],
    }),
  );

  const repetitionCycleValidatorFn = (props: ValidationFnProps) => {
    const participation_limit = formMethodsRef.current?.getValues(
      'participation_limit',
    );
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
      numberGTZeroValidationSchema.parse(input);

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

  const handleSubmit = (values: z.infer<typeof questFormValidationSchema>) => {
    const subFormErrors = validateSubForms();
    const repetitionCycleRadioBtnError =
      triggerRepetitionCycleRadioValidation();
    if (subFormErrors || repetitionCycleRadioBtnError) return;

    const handleAsync = async () => {
      try {
        const quest = await createQuest({
          name: values.name.trim(),
          description: values.description.trim(),
          end_date: new Date(values.end_date),
          start_date: new Date(values.start_date),
          image_url: values.image,
          ...(values?.community && {
            community_id: values.community.value,
          }),
        });

        if (quest && quest.id) {
          await updateQuest({
            quest_id: quest.id,
            action_metas: questActionSubForms.map((subForm) => ({
              event_name: subForm.values.action as QuestAction,
              reward_amount: parseInt(`${subForm.values.rewardAmount}`, 10),
              ...(subForm.values.creatorRewardAmount && {
                creator_reward_weight:
                  calculateRemainingPercentageChangeFractional(
                    parseInt(`${subForm.values.rewardAmount}`, 10),
                    parseInt(`${subForm.values.creatorRewardAmount}`, 10),
                  ),
              }),
              participation_limit: values.participation_limit,
              participation_period: repetitionCycleRadioProps
                .repetitionCycleSelectListProps.selected
                ?.value as QuestParticipationPeriod,
              participation_times_per_period: parseInt(
                `${repetitionCycleRadioProps.repetitionCycleInputProps.value}`,
              ),
              ...(subForm.values.actionLink && {
                action_link: subForm.values.actionLink.trim(),
              }),
            })),
          });
        }

        notifySuccess('Quest created!');

        navigate('/explore');
      } catch (e) {
        console.error(e);

        notifyError('Failed to create quest!');
      }
    };
    handleAsync().catch(console.error);
  };

  return {
    // subform specific fields
    MIN_ACTIONS_LIMIT,
    MAX_ACTIONS_LIMIT,
    addSubForm,
    questActionSubForms,
    removeSubFormByIndex,
    updateSubFormByIndex,
    validateSubForms,
    // main form specific fields
    handleSubmit,
    isProcessingQuestImage,
    setIsProcessingQuestImage,
    minStartDate,
    // custom radio button props
    repetitionCycleRadio: {
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
    },
    formMethodsRef,
  };
};

export default useQuestForm;
