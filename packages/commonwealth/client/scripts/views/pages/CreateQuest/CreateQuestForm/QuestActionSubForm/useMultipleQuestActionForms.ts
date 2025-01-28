import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import { useState } from 'react';
import { ZodError } from 'zod';
import './QuestActionSubForm.scss';
import { doesActionRequireCreatorReward } from './helpers';
import {
  QuestAction,
  QuestActionSubFormConfig,
  QuestActionSubFormErrors,
  QuestActionSubFormFields,
  QuestActionSubFormState,
  useQuestActionMultiFormsStateProps,
} from './types';
import {
  questSubFormValidationSchema,
  questSubFormValidationSchemaWithCreatorPoints,
} from './validation';

const useQuestActionMultiFormsState = ({
  minSubForms,
  maxSubForms,
  validateAfterUpdate = true,
}: useQuestActionMultiFormsStateProps) => {
  const [questActionSubForms, setQuestActionSubForms] = useState<
    QuestActionSubFormState[]
  >([]);

  const hasSubFormErrors = questActionSubForms.find(
    (subForm) => Object.keys(subForm.errors || {}).length > 0,
  );

  useRunOnceOnCondition({
    callback: () => {
      if (minSubForms) {
        setQuestActionSubForms(
          Array.from({ length: minSubForms }, (_, index) => ({
            values: {},
            id: index + 1,
          })),
        );
      }
    },
    shouldRun: true,
  });

  const addSubForm = () => {
    if (maxSubForms && questActionSubForms.length >= maxSubForms) return;

    setQuestActionSubForms((a) => [
      ...a,
      { values: {}, id: questActionSubForms.length + 1 },
    ]);
  };

  const validateFormValues = (
    values: QuestActionSubFormFields,
    config?: QuestActionSubFormConfig,
  ) => {
    let errors: QuestActionSubFormErrors = {};
    try {
      const schema = config?.requires_creator_points
        ? questSubFormValidationSchemaWithCreatorPoints
        : questSubFormValidationSchema;
      schema.parse(values);
    } catch (e) {
      const zodError = e as ZodError;
      zodError.errors.map((error) => {
        errors = {
          ...errors,
          [error.path[0] as keyof QuestActionSubFormErrors]: error.message,
        };
      });
    }
    return errors;
  };

  const validateSubFormByIndex = (index: number) => {
    const updatedSubForms = [...questActionSubForms];
    updatedSubForms[index].errors = validateFormValues(
      updatedSubForms[index].values,
      updatedSubForms[index].config,
    );
    setQuestActionSubForms([...updatedSubForms]);
  };

  const validateSubForms = (): boolean => {
    const updatedSubForms = [...questActionSubForms];
    updatedSubForms.map((form) => {
      form.errors = validateFormValues(form.values, form.config);
    });
    setQuestActionSubForms([...updatedSubForms]);
    const hasErrors = updatedSubForms.find(
      (subForm) => Object.keys(subForm.errors || {}).length > 0,
    );
    return !!hasErrors;
  };

  const updateSubFormByIndex = (
    updateBody: QuestActionSubFormFields,
    index: number,
  ) => {
    const updatedSubForms = [...questActionSubForms];
    updatedSubForms[index].values = {
      ...updatedSubForms[index].values,
      ...updateBody,
    };

    if (updatedSubForms[index].values.action) {
      const requiresCreatorPoints = doesActionRequireCreatorReward(
        updatedSubForms[index].values.action as QuestAction,
      );

      // update config based on chosen action
      updatedSubForms[index].config = {
        requires_creator_points: requiresCreatorPoints,
      };

      // reset errors/values if action doesn't require creator points
      if (!requiresCreatorPoints) {
        updatedSubForms[index].values.creatorRewardAmount = undefined;
        updatedSubForms[index].errors = {
          ...updatedSubForms[index].errors,
          creatorRewardAmount: undefined,
        };
      }
    }

    setQuestActionSubForms([...updatedSubForms]);

    if (validateAfterUpdate) validateSubFormByIndex(index);
  };

  const removeSubFormByIndex = (index: number) => {
    if (minSubForms && questActionSubForms.length === minSubForms) return;

    const updatedSubForms = [...questActionSubForms];
    updatedSubForms.splice(index, 1);
    setQuestActionSubForms([...updatedSubForms]);
  };

  return {
    hasSubFormErrors,
    questActionSubForms,
    addSubForm,
    removeSubFormByIndex,
    updateSubFormByIndex,
    validateSubFormByIndex,
    validateSubForms,
  };
};

export { useQuestActionMultiFormsState };
