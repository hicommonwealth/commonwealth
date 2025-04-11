import { QuestParticipationLimit } from '@hicommonwealth/schemas';
import {
  doesActionAllowCommentId,
  doesActionAllowContentId,
  doesActionAllowRepetition,
  doesActionAllowThreadId,
  doesActionAllowTopicId,
  doesActionRequireChainEvent,
  doesActionRequireDiscordServerURL,
  doesActionRequireRewardShare,
  doesActionRequireTwitterTweetURL,
} from 'helpers/quest';
import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import { useState } from 'react';
import { ZodError } from 'zod';
import './QuestActionSubForm.scss';
import {
  QuestAction,
  QuestActionContentIdScope,
  QuestActionSubFormConfig,
  QuestActionSubFormErrors,
  QuestActionSubFormFields,
  QuestActionSubFormInternalRefs,
  QuestActionSubFormState,
  useQuestActionMultiFormsStateProps,
} from './types';
import { buildQuestSubFormValidationSchema } from './validation';

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

  const setQuestActionSubFormsInitialState = () => {
    if (minSubForms) {
      setQuestActionSubForms([
        ...Array.from({ length: minSubForms }, (_, index) => ({
          values: {
            participationLimit: QuestParticipationLimit.OncePerQuest,
            contentIdScope: QuestActionContentIdScope.Topic,
          },
          refs: {
            runParticipationLimitValidator: () => {},
          },
          id: index + (questActionSubForms.length + 1),
        })),
      ]);
    }
  };

  useRunOnceOnCondition({
    callback: () => {
      setQuestActionSubFormsInitialState();
    },
    shouldRun: true,
  });

  const addSubForm = () => {
    if (maxSubForms && questActionSubForms.length >= maxSubForms) return;

    setQuestActionSubForms((a) => [
      ...a,
      {
        values: {
          participationLimit: QuestParticipationLimit.OncePerQuest,
          contentIdScope: QuestActionContentIdScope.Topic,
        },
        refs: { runParticipationLimitValidator: () => {} },
        id: questActionSubForms.length + 1,
      },
    ]);
  };

  const validateFormValues = (
    values: QuestActionSubFormFields,
    refs?: QuestActionSubFormInternalRefs,
    config?: QuestActionSubFormConfig,
  ) => {
    let errors: QuestActionSubFormErrors = {};

    // validate via zod
    try {
      const schema = buildQuestSubFormValidationSchema(config);
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

    // validate via custom validators
    const error = refs?.runParticipationLimitValidator?.();
    if (!errors.participationLimit && error) errors.participationLimit = error;

    return errors;
  };

  const validateSubFormByIndex = (index: number) => {
    const updatedSubForms = [...questActionSubForms];
    updatedSubForms[index].errors = validateFormValues(
      updatedSubForms[index].values,
      updatedSubForms[index].refs,
      updatedSubForms[index].config,
    );
    setQuestActionSubForms([...updatedSubForms]);
  };

  const validateSubForms = (): boolean => {
    const updatedSubForms = [...questActionSubForms];
    updatedSubForms.map((form) => {
      form.errors = validateFormValues(form.values, form.refs, form.config);
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
      const requiresCreatorPoints = doesActionRequireRewardShare(chosenAction);
      const allowsContentId = doesActionAllowContentId(chosenAction);
      const allowsTopicId =
        allowsContentId && doesActionAllowTopicId(chosenAction);
      const allowsTwitterTweetUrl =
        allowsContentId && doesActionRequireTwitterTweetURL(chosenAction);
      const requiresDiscordServerURL =
        doesActionRequireDiscordServerURL(chosenAction);
      const isActionRepeatable = doesActionAllowRepetition(chosenAction);

      // update config based on chosen action
      updatedSubForms[index].config = {
        requires_creator_points: requiresCreatorPoints,
        is_action_repeatable: isActionRepeatable,
        with_optional_topic_id: allowsTopicId,
        with_optional_comment_id:
          allowsContentId && doesActionAllowCommentId(chosenAction),
        with_optional_thread_id:
          allowsContentId && doesActionAllowThreadId(chosenAction),
        requires_twitter_tweet_link:
          allowsContentId && doesActionRequireTwitterTweetURL(chosenAction),
        requires_discord_server_url: requiresDiscordServerURL,
        requires_chain_event: doesActionRequireChainEvent(chosenAction),
      };

      // set fixed action repitition per certain actions
      if (!isActionRepeatable) {
        updatedSubForms[index].values.participationLimit =
          QuestParticipationLimit.OncePerQuest;
      }

      // reset errors/values if action doesn't require creator points
      if (!requiresCreatorPoints) {
        updatedSubForms[index].values.creatorRewardAmount = undefined;
        updatedSubForms[index].errors = {
          ...updatedSubForms[index].errors,
          creatorRewardAmount: undefined,
        };
      }

      // reset errors/values if action doesn't require content link
      if (!allowsContentId) {
        updatedSubForms[index].values.contentLink = undefined;
        updatedSubForms[index].errors = {
          ...updatedSubForms[index].errors,
          contentLink: undefined,
        };
      }

      // set fixed contentIdScope per certain actions
      switch (updateBody.action) {
        case 'TweetEngagement': {
          updatedSubForms[index].values.contentIdScope =
            QuestActionContentIdScope.TwitterTweet;
          break;
        }
        case 'CommonDiscordServerJoined': {
          updatedSubForms[index].values.contentIdScope =
            QuestActionContentIdScope.DiscordServer;
          break;
        }
        default: {
          break;
        }
      }

      // set/reset default values/config if action allows content link
      if (allowsContentId) {
        updatedSubForms[index].values.contentIdScope =
          updateBody.contentIdScope ||
          updatedSubForms[index].values.contentIdScope ||
          QuestActionContentIdScope.Thread;

        if (
          (updatedSubForms[index].values.contentIdScope ===
            QuestActionContentIdScope.Topic &&
            !allowsTopicId) ||
          (updatedSubForms[index].values.contentIdScope ===
            QuestActionContentIdScope.TwitterTweet &&
            !allowsTwitterTweetUrl) ||
          (updatedSubForms[index].values.contentIdScope ===
            QuestActionContentIdScope.DiscordServer &&
            !requiresDiscordServerURL)
        ) {
          updatedSubForms[index].values.contentIdScope =
            QuestActionContentIdScope.Thread;
        }

        updatedSubForms[index].errors = {
          ...updatedSubForms[index].errors,
          contentIdScope: undefined,
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
    setQuestActionSubFormsInitialState,
    setQuestActionSubForms,
    validateSubFormByIndex,
    validateSubForms,
  };
};

export { useQuestActionMultiFormsState };
