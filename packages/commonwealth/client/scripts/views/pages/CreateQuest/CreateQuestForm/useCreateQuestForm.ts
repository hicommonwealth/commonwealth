import { z } from 'zod';
import './CreateQuestForm.scss';
import { useQuestActionMultiFormsState } from './QuestActionSubForm/useMultipleQuestActionForms';
import { questFormValidationSchema } from './validation';

const MIN_ACTIONS_LIMIT = 1;
const MAX_ACTIONS_LIMIT = 8;

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

  const handleSubmit = (values: z.infer<typeof questFormValidationSchema>) => {
    const hasErrors = validateSubForms();
    if (hasErrors) return;

    // TODO: integrate API
    console.log('submit values => ', {
      ...values,
      subForms: questActionSubForms.map((f) => f.values),
    });
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
  };
};

export default useCreateQuestForm;
