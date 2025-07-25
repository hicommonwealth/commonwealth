import { QuestParticipationLimit } from '@hicommonwealth/schemas';
import {
  doesActionAllowChainId,
  doesActionAllowCommentId,
  doesActionAllowContentId,
  doesActionAllowRepetition,
  doesActionAllowSSOType,
  doesActionAllowThreadId,
  doesActionAllowTokenTradeThreshold,
  doesActionAllowTopicId,
  doesActionRequireAmountMultipler,
  doesActionRequireBasicRewardAmount,
  doesActionRequireChainEvent,
  doesActionRequireDiscordServerId,
  doesActionRequireGoalConfig,
  doesActionRequireGroupId,
  doesActionRequireRewardShare,
  doesActionRequireStartLink,
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
      const requiresBasicPoints =
        doesActionRequireBasicRewardAmount(chosenAction);
      const requiresCreatorPoints = doesActionRequireRewardShare(chosenAction);
      const allowsContentId = doesActionAllowContentId(chosenAction);
      const allowsTopicId =
        allowsContentId && doesActionAllowTopicId(chosenAction);
      const allowsChainId =
        allowsContentId && doesActionAllowChainId(chosenAction);
      const allowsTwitterTweetUrl =
        allowsContentId && doesActionRequireTwitterTweetURL(chosenAction);
      const requiresDiscordServerId =
        doesActionRequireDiscordServerId(chosenAction);
      const requiresGoalConfig = doesActionRequireGoalConfig(chosenAction);
      const requiresGroupId =
        allowsContentId && doesActionRequireGroupId(chosenAction);
      const allowsTokenTradeThreshold =
        allowsContentId && doesActionAllowTokenTradeThreshold(chosenAction);
      const isActionRepeatable = doesActionAllowRepetition(chosenAction);
      const requiresStartLink = doesActionRequireStartLink(chosenAction);

      // update config based on chosen action
      updatedSubForms[index].config = {
        requires_basic_points: requiresBasicPoints,
        requires_creator_points: requiresCreatorPoints,
        is_action_repeatable: isActionRepeatable,
        with_optional_topic_id: allowsTopicId,
        with_optional_comment_id:
          allowsContentId && doesActionAllowCommentId(chosenAction),
        with_optional_thread_id:
          allowsContentId && doesActionAllowThreadId(chosenAction),
        requires_twitter_tweet_link:
          allowsContentId && doesActionRequireTwitterTweetURL(chosenAction),
        requires_chain_event: doesActionRequireChainEvent(chosenAction),
        requires_discord_server_id: requiresDiscordServerId,
        requires_goal_config: requiresGoalConfig,
        with_optional_chain_id:
          allowsContentId && doesActionAllowChainId(chosenAction),
        requires_group_id: requiresGroupId,
        requires_start_link: requiresStartLink,
        requires_amount_multipler:
          doesActionRequireAmountMultipler(chosenAction),
        with_optional_token_trade_threshold: allowsTokenTradeThreshold,
        with_optional_sso_type:
          allowsContentId && doesActionAllowSSOType(chosenAction),
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

      // reset errors/values if action doesn't require content identifier
      if (!allowsContentId) {
        updatedSubForms[index].values.contentIdentifier = undefined;
        updatedSubForms[index].errors = {
          ...updatedSubForms[index].errors,
          contentIdentifier: undefined,
        };
      }

      // set fixed contentIdScope per certain actions
      switch (updateBody.action) {
        case 'TweetEngagement': {
          updatedSubForms[index].values.contentIdScope =
            QuestActionContentIdScope.TwitterTweet;
          break;
        }
        case 'DiscordServerJoined': {
          updatedSubForms[index].values.contentIdScope =
            QuestActionContentIdScope.DiscordServer;
          break;
        }
        case 'CommunityCreated': {
          updatedSubForms[index].values.contentIdScope =
            QuestActionContentIdScope.Chain;
          break;
        }
        case 'MembershipsRefreshed': {
          updatedSubForms[index].values.contentIdScope =
            QuestActionContentIdScope.Group;
          break;
        }
        case 'SSOLinked': {
          updatedSubForms[index].values.contentIdScope =
            QuestActionContentIdScope.Sso;
          break;
        }
        case 'LaunchpadTokenTraded': {
          updatedSubForms[index].values.contentIdScope =
            QuestActionContentIdScope.TokenTradeThreshold;
          break;
        }
        case 'CommunityGoalReached': {
          updatedSubForms[index].values.contentIdScope =
            QuestActionContentIdScope.Goal;
          break;
        }
        default: {
          break;
        }
      }

      // set/reset default values/config if action allows content identifier
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
            !requiresDiscordServerId) ||
          (updatedSubForms[index].values.contentIdScope ===
            QuestActionContentIdScope.Goal &&
            !requiresGoalConfig) ||
          (updatedSubForms[index].values.contentIdScope ===
            QuestActionContentIdScope.Chain &&
            !allowsChainId) ||
          (updatedSubForms[index].values.contentIdScope ===
            QuestActionContentIdScope.Group &&
            !requiresGroupId) ||
          (updatedSubForms[index].values.contentIdScope ===
            QuestActionContentIdScope.TokenTradeThreshold &&
            !allowsTokenTradeThreshold) ||
          (updatedSubForms[index].values.contentIdScope ===
            QuestActionContentIdScope.Sso &&
            !updatedSubForms[index].config?.with_optional_sso_type)
        ) {
          updatedSubForms[index].values.contentIdScope =
            QuestActionContentIdScope.Thread;
        }

        updatedSubForms[index].errors = {
          ...updatedSubForms[index].errors,
          contentIdScope: undefined,
          contentIdentifier: undefined,
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
