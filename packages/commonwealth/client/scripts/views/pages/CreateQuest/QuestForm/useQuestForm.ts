import {
  EVM_ADDRESS_STRICT,
  EVM_EVENT_SIGNATURE_STRICT,
  QuestParticipationLimit,
  QuestParticipationPeriod,
} from '@hicommonwealth/schemas';
import {
  CommunityGoalType,
  getDefaultContestImage,
} from '@hicommonwealth/shared';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { calculateRemainingPercentageChangeFractional } from 'helpers/number';
import {
  calculateTotalXPForQuestActions,
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
import { isEqual } from 'lodash';
import moment from 'moment';
import { useCommonNavigate } from 'navigation/helpers';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useCreateQuestMutation,
  useDeleteQuestMutation,
  useUpdateQuestMutation,
} from 'state/api/quests';
import {
  useCreateGoalMetaMutation,
  useGetGoalMetasQuery,
} from 'state/api/superAdmin';
import { CWFormRef } from 'views/components/component_kit/new_designs/CWForm';
import { openConfirmation } from 'views/modals/confirmation_modal';
import { z } from 'zod';
import { QuestAction, QuestActionContentIdScope } from './QuestActionSubForm';
import { useQuestActionMultiFormsState } from './QuestActionSubForm/useMultipleQuestActionForms';
import './QuestForm.scss';
import {
  buildContentIdFromIdentifier,
  doesConfigAllowContentIdField,
} from './helpers';
import { QuestFormProps } from './types';
import { buildDynamicQuestFormValidationSchema } from './validation';

const MIN_ACTIONS_LIMIT = 1;

const useQuestForm = ({ mode, initialValues, questId }: QuestFormProps) => {
  const questActions = {
    common: [
      'CommunityCreated',
      'CommunityJoined',
      'ThreadCreated',
      'ThreadUpvoted',
      'CommentCreated',
      'CommentUpvoted',
      'WalletLinked',
      'SSOLinked',
      'DiscordServerJoined',
      'MembershipsRefreshed',
      'RecurringContestManagerDeployed',
      'LaunchpadTokenRecordCreated',
      'LaunchpadTokenTraded',
      'LaunchpadTokenGraduated',
      'ContestEnded',
      'CommunityGoalReached',
    ] as QuestAction[],
    channel: ['TweetEngagement', 'XpChainEventCreated'] as QuestAction[],
  };
  const [availableQuestActions, setAvailableQuestActions] = useState<
    QuestAction[]
  >([...questActions.common]);
  const availableQuestActionsRef = useRef([...availableQuestActions]);
  availableQuestActionsRef.current = availableQuestActions;

  const {
    addSubForm,
    questActionSubForms,
    removeSubFormByIndex,
    updateSubFormByIndex,
    setQuestActionSubFormsInitialState,
    setQuestActionSubForms,
    validateSubForms,
  } = useQuestActionMultiFormsState({
    minSubForms: MIN_ACTIONS_LIMIT,
    maxSubForms: availableQuestActions.length,
  });

  useRunOnceOnCondition({
    callback: () => {
      if (initialValues) {
        if (initialValues?.subForms?.length > 0) {
          setQuestActionSubForms([
            ...initialValues.subForms.map((subForm, index) => {
              const chosenAction = subForm.action as QuestAction;
              const allowsContentId = doesActionAllowContentId(chosenAction);

              return {
                id: index + 1,
                values: {
                  action: chosenAction,
                  instructionsLink: subForm.instructionsLink || '',
                  contentIdScope: subForm.contentIdScope,
                  contentIdentifier: subForm.contentIdentifier || '',
                  startLink: subForm.startLink || '',
                  rewardAmount: subForm.rewardAmount,
                  ...(subForm?.creatorRewardAmount && {
                    creatorRewardAmount: subForm.creatorRewardAmount,
                  }),
                  ...(doesActionRequireTwitterTweetURL(chosenAction) && {
                    noOfLikes: subForm.noOfLikes || 0,
                    noOfRetweets: subForm.noOfRetweets || 0,
                    noOfReplies: subForm.noOfReplies || 0,
                  }),
                  ...(doesActionRequireAmountMultipler(chosenAction) && {
                    amountMultipler: subForm.amountMultipler || 0,
                  }),
                  ...(doesActionRequireChainEvent(chosenAction) && {
                    contractAddress: subForm.contractAddress,
                    ethChainId: subForm.ethChainId,
                    eventSignature: subForm.eventSignature,
                    transactionHash: subForm.transactionHash,
                  }),
                  ...(doesActionRequireGoalConfig(chosenAction) && {
                    goalTarget: subForm.goalTarget,
                    goalType: subForm.goalType,
                  }),
                  participationLimit: subForm.participationLimit,
                  participationPeriod: subForm.participationPeriod,
                  participationTimesPerPeriod:
                    subForm.participationTimesPerPeriod,
                },
                errors: {},
                config: {
                  requires_basic_points:
                    doesActionRequireBasicRewardAmount(chosenAction),
                  requires_creator_points:
                    doesActionRequireRewardShare(chosenAction),
                  is_action_repeatable: doesActionAllowRepetition(chosenAction),
                  with_optional_topic_id:
                    allowsContentId && doesActionAllowTopicId(chosenAction),
                  with_optional_thread_id:
                    allowsContentId && doesActionAllowThreadId(chosenAction),
                  with_optional_comment_id:
                    allowsContentId && doesActionAllowCommentId(chosenAction),
                  requires_twitter_tweet_link:
                    allowsContentId &&
                    doesActionRequireTwitterTweetURL(chosenAction),
                  requires_discord_server_id:
                    allowsContentId &&
                    doesActionRequireDiscordServerId(chosenAction),
                  requires_goal_config:
                    doesActionRequireGoalConfig(chosenAction),
                  requires_chain_event:
                    doesActionRequireChainEvent(chosenAction),
                  with_optional_chain_id:
                    allowsContentId && doesActionAllowChainId(chosenAction),
                  requires_group_id:
                    allowsContentId && doesActionRequireGroupId(chosenAction),
                  requires_start_link: doesActionRequireStartLink(chosenAction),
                  requires_amount_multipler:
                    doesActionRequireAmountMultipler(chosenAction),
                  with_optional_token_trade_threshold:
                    allowsContentId &&
                    doesActionAllowTokenTradeThreshold(chosenAction),
                  with_optional_sso_type:
                    allowsContentId && doesActionAllowSSOType(chosenAction),
                },
              };
            }),
          ]);
        }
      }
    },
    shouldRun: !!(initialValues && mode === 'update'),
  });

  const minStartDate = new Date(new Date().getTime() + 1 * 60 * 60 * 1000); // now + 1 hour in future
  const idealStartDate = new Date(
    new Date().getTime() + 1 * 24 * 60 * 60 * 1000,
  ); // now + 1 day in future
  const minEndDate = new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000); // now + 1 day in future

  const [isProcessingQuestImage, setIsProcessingQuestImage] = useState(false);
  const [minQuestLevelXP, setMinQuestLevelXP] = useState(0);

  const { mutateAsync: createQuest } = useCreateQuestMutation();
  const { mutateAsync: updateQuest } = useUpdateQuestMutation();
  const { mutateAsync: deleteQuest } = useDeleteQuestMutation();
  const { mutateAsync: createGoalMeta } = useCreateGoalMetaMutation();
  const { data: goalMetas = [] } = useGetGoalMetasQuery({
    apiEnabled: true,
  });
  const createQuestIdRef = useRef<number>();

  const navigate = useCommonNavigate();

  const formMethodsRef = useRef<CWFormRef>(null);

  const triggerCalculateTotalXPForQuestActions = useCallback(() => {
    setMinQuestLevelXP(
      calculateTotalXPForQuestActions({
        isUserReferred: false, // we assume user is not referred to calculate the max lower/upper limit,
        questActions: [...questActionSubForms].map(({ values }) => ({
          creator_reward_weight: parseInt(`${values.creatorRewardAmount || 0}`),
          event_name: values.action as QuestAction,
          quest_id: Math.random(),
          reward_amount: parseInt(`${values.rewardAmount || 0}`),
          participation_times_per_period: parseInt(
            `${values.participationTimesPerPeriod || 0}`,
          ),
          participation_limit:
            values.participationLimit || QuestParticipationLimit.OncePerQuest,
          participation_period:
            values.participationPeriod || QuestParticipationPeriod.Daily,
        })),
        questEndDate:
          formMethodsRef?.current?.getValues('end_date') || new Date(),
        questStartDate:
          formMethodsRef?.current?.getValues('start_date') || new Date(),
      })?.totalXpFixed, // Note: dynamic xp calculation is not needed here
    );
  }, [questActionSubForms]);

  // recalculate `minQuestLevelXP` when parent form changes
  formMethodsRef?.current?.watch(() =>
    triggerCalculateTotalXPForQuestActions(),
  );

  // recalculate `minQuestLevelXP` when any subform changes
  useEffect(() => {
    triggerCalculateTotalXPForQuestActions();
  }, [questActionSubForms, triggerCalculateTotalXPForQuestActions]);

  // recalculate `max_xp_to_end` field error state when `minQuestLevelXP` changes
  useEffect(() => {
    formMethodsRef?.current?.trigger('max_xp_to_end').catch(console.error);
  }, [minQuestLevelXP]);

  const handleQuestMutateConfirmation = async (hours: number) => {
    return new Promise((resolve, reject) => {
      openConfirmation({
        title: `Confirm Quest ${mode === 'create' ? 'Creation' : 'Updation'}`,
        // eslint-disable-next-line max-len
        description: `Are you sure you want to ${mode} this quest ${hours ? `${hours} hour${hours > 1 ? 's' : ''} in advance` : `that starts in a few moments`}? \n\nWe suggest creating/updating quests atleast 24+ hours in advance.\nThis allow users to get plenty of time to prepare, and for you to have plenty of time for any necessary changes.`,
        buttons: [
          {
            label: 'Cancel',
            buttonType: 'secondary',
            buttonHeight: 'sm',
            onClick: reject,
          },
          {
            label: 'Confirm',
            buttonType: 'destructive',
            buttonHeight: 'sm',
            onClick: resolve,
          },
        ],
      });
    });
  };

  const buildActionMetasPayload = () => {
    return questActionSubForms.map((subForm) => {
      const contentIdScope = (() => {
        const scope = subForm.values?.contentIdScope;
        if (scope === QuestActionContentIdScope.TwitterTweet)
          return 'tweet_url';
        if (scope === QuestActionContentIdScope.DiscordServer)
          return 'discord_server_id';
        if (scope === QuestActionContentIdScope.Topic) return 'topic';
        if (scope === QuestActionContentIdScope.Chain) return 'chain';
        if (scope === QuestActionContentIdScope.Group) return 'group';
        if (scope === QuestActionContentIdScope.Goal) return 'goal';
        if (scope === QuestActionContentIdScope.Sso) return 'sso';
        if (scope === QuestActionContentIdScope.TokenTradeThreshold) {
          return 'threshold';
        }
        if (scope === QuestActionContentIdScope.Thread) {
          if (subForm.config?.with_optional_comment_id) return 'comment';
          return 'thread';
        }
        return 'thread';
      })();

      return {
        event_name: subForm.values.action as QuestAction,
        reward_amount: parseInt(`${subForm.values.rewardAmount || 0}`, 10),
        ...(subForm.values.creatorRewardAmount && {
          creator_reward_weight: calculateRemainingPercentageChangeFractional(
            parseInt(`${subForm.values.rewardAmount}`, 10),
            parseInt(`${subForm.values.creatorRewardAmount || 0}`, 10),
          ),
        }),
        ...(subForm.values.contentIdentifier &&
          subForm.config &&
          (doesConfigAllowContentIdField(subForm.config) ||
            subForm.config.requires_goal_config) && {
            content_id: buildContentIdFromIdentifier(
              subForm.values.contentIdentifier,
              contentIdScope,
            ),
          }),
        ...(subForm.values.startLink && {
          start_link: subForm.values.startLink.trim(),
        }),
        ...((subForm.values.noOfLikes ||
          subForm.values.noOfRetweets ||
          subForm.values.noOfReplies) && {
          tweet_engagement_caps: {
            likes: parseInt(`${subForm.values.noOfLikes || 0}`) || 0,
            retweets: parseInt(`${subForm.values.noOfRetweets || 0}`) || 0,
            replies: parseInt(`${subForm.values.noOfReplies || 0}`) || 0,
          },
        }),
        ...(subForm.config?.requires_chain_event && {
          chain_event: {
            eth_chain_id: parseInt(`${subForm.values.ethChainId}`, 10),
            contract_address: subForm.values.contractAddress! as z.infer<
              typeof EVM_ADDRESS_STRICT
            >,
            event_signature: subForm.values.eventSignature! as z.infer<
              typeof EVM_EVENT_SIGNATURE_STRICT
            >,
            tx_hash: subForm.values.transactionHash! as z.infer<
              typeof EVM_EVENT_SIGNATURE_STRICT
            >,
          },
        }),
        participation_limit: subForm.values.participationLimit,
        participation_period: subForm.values
          .participationPeriod as QuestParticipationPeriod,
        participation_times_per_period: parseInt(
          `${subForm.values.participationTimesPerPeriod}`,
        ),
        ...(subForm.values.instructionsLink && {
          instructions_link: subForm.values.instructionsLink.trim(),
        }),
        amount_multiplier: subForm.config?.requires_amount_multipler
          ? parseInt(`${subForm.values.amountMultipler || 0}`)
          : 0,
      };
    });
  };

  const handleCreateQuest = async (
    values: z.infer<ReturnType<typeof buildDynamicQuestFormValidationSchema>>,
  ) => {
    const quest = await createQuest({
      name: values.name.trim(),
      description: values.description.trim(),
      end_date: new Date(values.end_date),
      start_date: new Date(values.start_date),
      image_url: values.image || getDefaultContestImage(),
      max_xp_to_end: parseInt(values.max_xp_to_end),
      ...(values?.community && {
        community_id: values.community.value,
      }),
      quest_type: values.quest_type,
    });

    if (quest && quest.id) {
      createQuestIdRef.current = quest.id;
      await updateQuest({
        quest_id: quest.id,
        action_metas: buildActionMetasPayload(),
      });
    }
  };

  const handleUpdateQuest = async (
    values: z.infer<ReturnType<typeof buildDynamicQuestFormValidationSchema>>,
  ) => {
    if (!questId) return;

    await updateQuest({
      quest_id: questId,
      description: values.description.trim(),
      ...(initialValues.name !== values.name.trim() && {
        name: values.name.trim(),
      }),
      ...(initialValues.end_date !== values.end_date && {
        end_date: new Date(values.end_date),
      }),
      ...(initialValues.start_date !== values.start_date && {
        start_date: new Date(values.start_date),
      }),
      max_xp_to_end: parseInt(values.max_xp_to_end),
      image_url: values.image || getDefaultContestImage(),
      community_id: values?.community?.value || null, // send null to remove community association
      action_metas: buildActionMetasPayload(),
    });
  };

  const handleGoalMetaAssignment = async () => {
    const foundCommunityGoalReachedActionIndex = questActionSubForms.findIndex(
      (f) => f.values.action === 'CommunityGoalReached',
    );
    if (foundCommunityGoalReachedActionIndex < 0) return true;
    const { goalTarget, goalType } =
      questActionSubForms[foundCommunityGoalReachedActionIndex]?.values || {};
    if (goalTarget && goalType) {
      // find existing goal meta, use its id if present
      const foundMeta = goalMetas.find(
        (m) => m.type === goalType && m.target === parseInt(`${goalTarget}`),
      );
      if (foundMeta) {
        // TODO: fix - api throws unique constraint error if goal id is repeated
        console.log('foundMeta => ', foundMeta);
        // updateSubFormByIndex(
        //   {
        //     contentIdentifier: `${foundMeta.id || ''}`,
        //   },
        //   foundCommunityGoalReachedActionIndex,
        // );
        // return true;
      }

      try {
        // create goal meta
        const name = [String(goalType), String(goalTarget)]
          .sort((a, b) => b.localeCompare(a))
          .join('-'); // creating manually, ensure dups aren't created
        const goal = await createGoalMeta({
          name,
          description: name,
          target: parseInt(`${goalTarget}`),
          type: goalType as CommunityGoalType,
        });
        updateSubFormByIndex(
          {
            contentIdentifier: `${goal.id || ''}`,
          },
          foundCommunityGoalReachedActionIndex,
        );
        await new Promise((r) => setTimeout(r, 500));
        return true;
      } catch (error) {
        const subFormErrors = validateSubForms();
        if (subFormErrors) {
          return false;
        }
        notifyError(
          `Failed to create goal config for 'Community Goal Reached' action`,
        );
        return false;
      }
    }
  };

  const handleSubmit = async (
    values: z.infer<ReturnType<typeof buildDynamicQuestFormValidationSchema>>,
  ) => {
    const isAssigned = await handleGoalMetaAssignment().catch(() => false);
    if (!isAssigned) return;

    const subFormErrors = validateSubForms();

    if (subFormErrors || (mode === 'update' ? !questId : false)) {
      return;
    }

    const handleMutation = async () => {
      try {
        if (mode === 'create') {
          await handleCreateQuest(values);
          notifySuccess(`Quest ${mode}d!`);
          navigate('/explore?tab=quests');
        }
        if (mode === 'update') {
          await handleUpdateQuest(values);
          notifySuccess(`Quest ${mode}d!`);
          // redirect to quest details page after update
          navigate(`/quests/${questId}`, {}, values?.community?.value || null);
        }
      } catch (e) {
        console.error(e);

        const error = (e?.message || '').toLowerCase();
        if (error.includes('must be at least 0 days in the future')) {
          notifyError('Start date must be a future date');
          return;
        }
        if (error.includes?.('must not exist')) {
          notifyError('Quest with provided name already exists!');
          return;
        }
        if (error.includes('must exist')) {
          if (error.includes('comment with id')) {
            const commentId = error.match(/id "(\d+)"/)[1];
            const tempForm = [...questActionSubForms];
            const foundSubForm = tempForm.find(
              (form) =>
                form.values.contentIdentifier?.includes(
                  `comment=${commentId}`,
                ) ||
                form.values.contentIdentifier?.includes(`comment/${commentId}`),
            );
            if (foundSubForm) {
              foundSubForm.errors = {
                ...(foundSubForm.errors || {}),
                contentIdentifier: `Invalid comment link.${
                  values?.community
                    ? ' Comment must belong to a thread of selected community'
                    : ''
                }`,
              };
            }
            setQuestActionSubForms([...tempForm]);
          }
          if (error.includes('thread with id')) {
            const threadId = error.match(/id "(\d+)"/)[1];
            const tempForm = [...questActionSubForms];
            const foundSubForm = tempForm.find((form) =>
              form.values.contentIdentifier?.includes(`discussion/${threadId}`),
            );
            if (foundSubForm) {
              foundSubForm.errors = {
                ...(foundSubForm.errors || {}),
                contentIdentifier: `Invalid thread link.${
                  values?.community
                    ? ' Thread must belong to selected community'
                    : ''
                }`,
              };
            }
            setQuestActionSubForms([...tempForm]);
          }
          if (error.includes('topic with id')) {
            const topicId = error.match(/id "(\d+)"/)[1];
            const tempForm = [...questActionSubForms];
            const foundSubForm = tempForm.find(
              (form) =>
                form.config?.with_optional_topic_id &&
                form.values.contentIdScope ===
                  QuestActionContentIdScope.Topic &&
                form.values.contentIdentifier?.includes(`${topicId}`),
            );
            if (foundSubForm) {
              foundSubForm.errors = {
                ...(foundSubForm.errors || {}),
                contentIdentifier: `Invalid topic link.${
                  values?.community
                    ? ' Topic must belong to selected community'
                    : ''
                }`,
              };
            }
            setQuestActionSubForms([...tempForm]);
          }
          if (error.includes('group with id')) {
            const groupId = error.match(/id "(\d+)"/)[1];
            const tempForm = [...questActionSubForms];
            const foundSubForm = tempForm.find(
              (form) =>
                form.config?.requires_group_id &&
                form.values.contentIdScope ===
                  QuestActionContentIdScope.Group &&
                form.values.contentIdentifier?.includes(`${groupId}`),
            );
            if (foundSubForm) {
              foundSubForm.errors = {
                ...(foundSubForm.errors || {}),
                contentIdentifier: `Invalid group link.${
                  values?.community
                    ? ' Group must belong to selected community'
                    : ''
                }`,
              };
            }
            setQuestActionSubForms([...tempForm]);
          }
          if (error.includes('tweet with url')) {
            const tempForm = [...questActionSubForms];
            const foundSubForm = tempForm.find((form) =>
              error.includes(form.values.contentIdentifier),
            );
            if (foundSubForm) {
              foundSubForm.errors = {
                ...(foundSubForm.errors || {}),
                contentIdentifier: `Invalid tweet url. Ensure tweet exists on twitter.`,
              };
            }
            setQuestActionSubForms([...tempForm]);
          }
          notifyError('Failed to update quest! Please fix form errors');
          return;
        }
        if (error.includes('invalid topic url')) {
          const tempForm = [...questActionSubForms];
          const foundSubForm = tempForm.find(
            (form) =>
              form.config?.with_optional_topic_id &&
              form.values.contentIdScope === QuestActionContentIdScope.Topic &&
              error.includes(
                form.values?.contentIdentifier?.trim()?.toLowerCase(),
              ),
          );
          if (foundSubForm) {
            foundSubForm.errors = {
              ...(foundSubForm.errors || {}),
              contentIdentifier: `Invalid topic link.`,
            };
          }
          setQuestActionSubForms([...tempForm]);
          return;
        }
        if (error.includes('tweet url is already part of a quest')) {
          const tempForm = [...questActionSubForms];
          const foundSubForm = tempForm.find(
            (form) => form.values?.action === 'TweetEngagement',
          );
          if (foundSubForm) {
            foundSubForm.errors = {
              ...(foundSubForm.errors || {}),
              contentIdentifier: `This tweet is already part of another quest.`,
            };
          }
          setQuestActionSubForms([...tempForm]);
          return;
        }
        if (error.includes('community id is required when setting goals')) {
          notifyError(
            `Community scope is required for setting a community goal`,
          );
          return;
        }
        notifyError(`Failed to ${mode} quest!`);

        // delete the invalid created quest
        if (createQuestIdRef.current) {
          await deleteQuest({
            quest_id: createQuestIdRef.current,
          }).catch(console.error);
          createQuestIdRef.current = undefined;
        }
      }
    };
    const questStartHoursDiffFromNow = moment(values.start_date).diff(
      moment(),
      'hours',
    );
    // request confirmation from user if quest is being created <=6 hours in advance
    if (questStartHoursDiffFromNow <= 6) {
      handleQuestMutateConfirmation(questStartHoursDiffFromNow)
        .then(() => handleMutation().catch(console.error))
        .catch(console.error);
    } else {
      handleMutation().catch(console.error);
    }
  };

  // recalculate `availableQuestActions` when quest type changes
  formMethodsRef?.current?.watch((values) => {
    const newActions = [...questActions[values.quest_type]];
    const oldActions = [...(availableQuestActionsRef.current || [])];

    // if quest type changes, reset all quest actions
    if (!isEqual([...oldActions], newActions)) {
      setQuestActionSubFormsInitialState();
    }

    setAvailableQuestActions(newActions);
  });

  return {
    // subform specific fields
    MIN_ACTIONS_LIMIT,
    MAX_ACTIONS_LIMIT: availableQuestActions.length,
    addSubForm,
    questActionSubForms,
    removeSubFormByIndex,
    updateSubFormByIndex,
    validateSubForms,
    // main form specific fields
    minQuestLevelXP,
    handleSubmit,
    isProcessingQuestImage,
    setIsProcessingQuestImage,
    minStartDate,
    idealStartDate,
    minEndDate,
    formMethodsRef,
    availableQuestActions,
  };
};

export default useQuestForm;
