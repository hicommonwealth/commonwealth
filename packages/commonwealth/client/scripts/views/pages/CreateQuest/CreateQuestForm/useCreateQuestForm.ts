import { QuestEvents, QuestParticipationPeriod } from '@hicommonwealth/schemas';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { calculatePercentageChangeFractional } from 'helpers/number';
import { useCommonNavigate } from 'navigation/helpers';
import { useState } from 'react';
import {
  useCreateQuestMutation,
  useUpdateQuestMutation,
} from 'state/api/quests';
import { z } from 'zod';
import { useCWRepetitionCycleRadioButton } from './CWRepetitionCycleRadioButton';
import './CreateQuestForm.scss';
import { QuestAction } from './QuestActionSubForm';
import { useQuestActionMultiFormsState } from './QuestActionSubForm/useMultipleQuestActionForms';
import { questFormValidationSchema } from './validation';

const MIN_ACTIONS_LIMIT = 1;
const MAX_ACTIONS_LIMIT = Object.values(QuestEvents).length; // = 8 max actions

const useCreateQuestForm = () => {
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

  const repetitionCycleOptions = Object.keys(QuestParticipationPeriod).map(
    (k) => ({
      label: k,
      value: k,
    }),
  );
  const repetitionCycleRadioProps = useCWRepetitionCycleRadioButton({
    repetitionCycleInputProps: {
      value: 1,
    },
    repetitionCycleSelectListProps: {
      options: repetitionCycleOptions,
      selected: repetitionCycleOptions[0],
    },
  });

  const handleSubmit = (values: z.infer<typeof questFormValidationSchema>) => {
    const hasErrors = validateSubForms();
    if (hasErrors) return;

    const handleAsync = async () => {
      try {
        const quest = await createQuest({
          name: values.name.trim(),
          description: values.description.trim(),
          end_date: new Date(values.end_date),
          start_date: new Date(values.start_date),
          // TODO: add image support in api (needs ticketing).
        });

        if (quest && quest.id) {
          await updateQuest({
            quest_id: quest.id,
            action_metas: questActionSubForms.map((subForm) => ({
              event_name: subForm.values.action as QuestAction,
              reward_amount: parseInt(`${subForm.values.rewardAmount}`, 10),
              ...(subForm.values.creatorRewardAmount && {
                creator_reward_weight: calculatePercentageChangeFractional(
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
    repetitionCycleRadioProps: {
      repetitionCycleInputProps: {
        ...repetitionCycleRadioProps.repetitionCycleInputProps,
      },
      repetitionCycleSelectListProps: {
        ...repetitionCycleRadioProps.repetitionCycleSelectListProps,
      },
    },
  };
};

export default useCreateQuestForm;
