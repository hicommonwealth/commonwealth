import { QuestEvents, QuestParticipationPeriod } from '@hicommonwealth/schemas';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { useCommonNavigate } from 'navigation/helpers';
import { useState } from 'react';
import {
  useCreateQuestMutation,
  useUpdateQuestMutation,
} from 'state/api/quests';
import { z } from 'zod';
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

  const [isProcessingQuestImage, setIsProcessingQuestImage] = useState(false);

  const { mutateAsync: createQuest } = useCreateQuestMutation();
  const { mutateAsync: updateQuest } = useUpdateQuestMutation();

  const navigate = useCommonNavigate();

  const handleSubmit = (values: z.infer<typeof questFormValidationSchema>) => {
    const hasErrors = validateSubForms();
    if (hasErrors) return;

    const handleAsync = async () => {
      try {
        console.log('submit values => ', {
          ...values,
          subForms: questActionSubForms.map((f) => f.values),
        });

        const quest = await createQuest({
          community_id: 'dydx', // TBD: do we need this if super admin is creating quest?,
          // adding sample community for now
          description: values.description.trim(),
          end_date: new Date(values.end_date),
          start_date: new Date(values.start_date),
          name: values.name.trim(),
          // TODO: add image support
        });

        if (quest && quest.id && quest.community_id) {
          await updateQuest({
            community_id: quest.community_id,
            quest_id: quest.id,
            action_metas: questActionSubForms.map((subForm) => ({
              event_name: subForm.values.action as QuestAction,
              reward_amount: parseInt(`${values.reward_amount}`, 10),
              participation_limit: values.participation_limit,
              participation_period: QuestParticipationPeriod.Daily,
              participation_times_per_period: 1,
            })),
          });
        }

        notifySuccess('Quest created!');

        // TODO: quests exploration will come in https://github.com/hicommonwealth/commonwealth/issues/9348
        navigate('/communities');
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
  };
};

export default useCreateQuestForm;
