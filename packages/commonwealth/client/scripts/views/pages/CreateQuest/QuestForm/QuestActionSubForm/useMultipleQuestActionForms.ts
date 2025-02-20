import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import { useState } from 'react';
import { ZodError } from 'zod';
import './QuestActionSubForm.scss';
import {
  doesActionRequireContentId,
  doesActionRequireCreatorReward,
} from './helpers';
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
  questSubFormValidationSchemaWithContentLink,
  questSubFormValidationSchemaWithCreatorPoints,
  questSubFormValidationSchemaWithCreatorPointsWithContentLink,
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

  const buildValidationSchema = (config?: QuestActionSubFormConfig) => {
    if (config?.requires_comment_id || config?.requires_thread_id) {
      if (config?.requires_creator_points) {
        return questSubFormValidationSchemaWithCreatorPointsWithContentLink;
      }

      return questSubFormValidationSchemaWithContentLink;
    }

    if (config?.requires_creator_points) {
      return questSubFormValidationSchemaWithCreatorPoints;
    }

    return questSubFormValidationSchema;
  };

  const validateFormValues = (
    values: QuestActionSubFormFields,
    config?: QuestActionSubFormConfig,
  ) => {
    let errors: QuestActionSubFormErrors = {};
    try {
      const schema = buildValidationSchema(config);
      schema.parse(values);

      // TODO: thread/comment url validations
      // validate content link matches a defined pattern
      // if (values.contentLink) {
      //   if (config?.requires_thread_id) {
      //     const isValidlink = THREAD_URL_VALIDATION_REGEX.test(
      //       values.contentLink,
      //     );
      //     if (!isValidlink) {
      //       errors = {
      //         ...errors,
      //         contentLink: 'Invalid thread link',
      //       };
      //     }
      //   }
      //   if (config?.requires_comment_id) {
      //     const isValidlink = COMMENT_URL_VALIDATION_REGEX.test(
      //       values.contentLink,
      //     );
      //     if (!isValidlink) {
      //       errors = {
      //         ...errors,
      //         contentLink: 'Invalid comment link',
      //       };
      //     }
      //   }
      // }
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

    const chosenAction = updatedSubForms[index].values.action as QuestAction;
    if (chosenAction) {
      const requiresCreatorPoints =
        doesActionRequireCreatorReward(chosenAction);
      const requiresContentId = doesActionRequireContentId(chosenAction);

      // update config based on chosen action
      updatedSubForms[index].config = {
        requires_creator_points: requiresCreatorPoints,
        requires_comment_id:
          requiresContentId && chosenAction === 'CommentUpvoted',
        requires_thread_id:
          requiresContentId &&
          (chosenAction === 'CommentCreated' ||
            chosenAction === 'ThreadUpvoted'),
      };

      // reset errors/values if action doesn't require creator points
      if (!requiresCreatorPoints) {
        updatedSubForms[index].values.creatorRewardAmount = undefined;
        updatedSubForms[index].errors = {
          ...updatedSubForms[index].errors,
          creatorRewardAmount: undefined,
        };
      }

      // reset errors/values if action doesn't require content link
      if (!requiresCreatorPoints) {
        updatedSubForms[index].values.contentLink = undefined;
        updatedSubForms[index].errors = {
          ...updatedSubForms[index].errors,
          contentLink: undefined,
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
    setQuestActionSubForms,
    validateSubFormByIndex,
    validateSubForms,
  };
};

export { useQuestActionMultiFormsState };
