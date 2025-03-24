import { QuestEvents, QuestParticipationPeriod } from '@hicommonwealth/schemas';
import { getDefaultContestImage } from '@hicommonwealth/shared';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { calculateRemainingPercentageChangeFractional } from 'helpers/number';
import {
  doesActionAllowCommentId,
  doesActionAllowContentId,
  doesActionAllowThreadId,
  doesActionAllowTopicId,
  doesActionRequireRewardShare,
} from 'helpers/quest';
import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import moment from 'moment';
import { useCommonNavigate } from 'navigation/helpers';
import { useRef, useState } from 'react';
import {
  useCreateQuestMutation,
  useUpdateQuestMutation,
} from 'state/api/quests';
import { CWFormRef } from 'views/components/component_kit/new_designs/CWForm';
import { openConfirmation } from 'views/modals/confirmation_modal';
import { z } from 'zod';
import { QuestAction, QuestActionContentIdScope } from './QuestActionSubForm';
import { useQuestActionMultiFormsState } from './QuestActionSubForm/useMultipleQuestActionForms';
import './QuestForm.scss';
import { buildContentIdFromURL } from './helpers';
import {
  QuestActionSubFormValuesWithContentLink,
  QuestActionSubFormValuesWithCreatorPoints,
  QuestFormProps,
} from './types';
import { questFormValidationSchema } from './validation';

const MIN_ACTIONS_LIMIT = 1;
const MAX_ACTIONS_LIMIT = Object.values(QuestEvents).length; // = 8 max actions

const useQuestForm = ({ mode, initialValues, questId }: QuestFormProps) => {
  const {
    addSubForm,
    questActionSubForms,
    removeSubFormByIndex,
    updateSubFormByIndex,
    setQuestActionSubForms,
    validateSubForms,
  } = useQuestActionMultiFormsState({
    minSubForms: MIN_ACTIONS_LIMIT,
    maxSubForms: MAX_ACTIONS_LIMIT,
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
                  contentIdScope: (
                    subForm as QuestActionSubFormValuesWithContentLink
                  ).contentIdScope,
                  contentLink:
                    (subForm as QuestActionSubFormValuesWithContentLink)
                      .contentLink || '',
                  rewardAmount: subForm.rewardAmount,
                  ...((subForm as QuestActionSubFormValuesWithCreatorPoints)
                    ?.creatorRewardAmount && {
                    creatorRewardAmount: (
                      subForm as QuestActionSubFormValuesWithCreatorPoints
                    ).creatorRewardAmount,
                  }),
                  participationLimit: subForm.participationLimit,
                  participationPeriod: subForm.participationPeriod,
                  participationTimesPerPeriod:
                    subForm.participationTimesPerPeriod,
                },
                errors: {},
                config: {
                  requires_creator_points:
                    doesActionRequireRewardShare(chosenAction),
                  with_optional_topic_id:
                    allowsContentId && doesActionAllowTopicId(chosenAction),
                  with_optional_thread_id:
                    allowsContentId && doesActionAllowThreadId(chosenAction),
                  with_optional_comment_id:
                    allowsContentId && doesActionAllowCommentId(chosenAction),
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

  const { mutateAsync: createQuest } = useCreateQuestMutation();
  const { mutateAsync: updateQuest } = useUpdateQuestMutation();

  const navigate = useCommonNavigate();

  const formMethodsRef = useRef<CWFormRef>(null);

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

  const handleCreateQuest = async (
    values: z.infer<typeof questFormValidationSchema>,
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
      quest_type: 'common',
    });

    if (quest && quest.id) {
      await updateQuest({
        quest_id: quest.id,
        action_metas: await Promise.all(
          questActionSubForms.map(async (subForm) => ({
            event_name: subForm.values.action as QuestAction,
            reward_amount: parseInt(`${subForm.values.rewardAmount}`, 10),
            ...(subForm.values.creatorRewardAmount && {
              creator_reward_weight:
                calculateRemainingPercentageChangeFractional(
                  parseInt(`${subForm.values.rewardAmount}`, 10),
                  parseInt(`${subForm.values.creatorRewardAmount}`, 10),
                ),
            }),
            ...(subForm.values.contentLink &&
              (subForm.config?.with_optional_comment_id ||
                subForm.config?.with_optional_thread_id ||
                subForm.config?.with_optional_topic_id) && {
                content_id: await buildContentIdFromURL(
                  subForm.values.contentLink,
                  subForm.values?.contentIdScope ===
                    QuestActionContentIdScope.Thread
                    ? subForm.config?.with_optional_comment_id
                      ? 'comment'
                      : 'thread'
                    : 'topic',
                ),
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
            amount_multiplier: 0,
          })),
        ),
      });
    }
  };

  const handleUpdateQuest = async (
    values: z.infer<typeof questFormValidationSchema>,
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
      action_metas: await Promise.all(
        questActionSubForms.map(async (subForm) => ({
          event_name: subForm.values.action as QuestAction,
          reward_amount: parseInt(`${subForm.values.rewardAmount}`, 10),
          ...(subForm.values.creatorRewardAmount && {
            creator_reward_weight: calculateRemainingPercentageChangeFractional(
              parseInt(`${subForm.values.rewardAmount}`, 10),
              parseInt(`${subForm.values.creatorRewardAmount}`, 10),
            ),
          }),
          ...(subForm.values.contentLink &&
            (subForm.config?.with_optional_comment_id ||
              subForm.config?.with_optional_thread_id ||
              subForm.config?.with_optional_topic_id) && {
              content_id: await buildContentIdFromURL(
                subForm.values.contentLink,
                subForm.values?.contentIdScope ===
                  QuestActionContentIdScope.Thread
                  ? subForm.config?.with_optional_comment_id
                    ? 'comment'
                    : 'thread'
                  : 'topic',
              ),
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
          amount_multiplier: 0,
        })),
      ),
    });
  };

  const handleSubmit = (values: z.infer<typeof questFormValidationSchema>) => {
    const subFormErrors = validateSubForms();

    if (subFormErrors || (mode === 'update' ? !questId : false)) {
      return;
    }

    const handleAsync = async () => {
      try {
        if (mode === 'create') {
          await handleCreateQuest(values);
          notifySuccess(`Quest ${mode}d!`);
          navigate('/explore');
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
                form.values.contentLink?.includes(`comment=${commentId}`) ||
                form.values.contentLink?.includes(`comment/${commentId}`),
            );
            if (foundSubForm) {
              foundSubForm.errors = {
                ...(foundSubForm.errors || {}),
                contentLink: `Invalid comment link.${
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
              form.values.contentLink?.includes(`discussion/${threadId}`),
            );
            if (foundSubForm) {
              foundSubForm.errors = {
                ...(foundSubForm.errors || {}),
                contentLink: `Invalid thread link.${
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
                form.values.contentLink?.includes(`${topicId}`),
            );
            if (foundSubForm) {
              foundSubForm.errors = {
                ...(foundSubForm.errors || {}),
                contentLink: `Invalid topic link.${
                  values?.community
                    ? ' Topic must belong to selected community'
                    : ''
                }`,
              };
            }
            setQuestActionSubForms([...tempForm]);
          }
          notifyError('Failed to update quest! Please fix form errors');
          return;
        }
        notifyError(`Failed to ${mode} quest!`);
      }
    };
    const questStartHoursDiffFromNow = moment(values.start_date).diff(
      moment(),
      'hours',
    );
    // request confirmation from user if quest is being created <=6 hours in advance
    if (questStartHoursDiffFromNow <= 6) {
      handleQuestMutateConfirmation(questStartHoursDiffFromNow)
        .then(() => handleAsync().catch(console.error))
        .catch(console.error);
    } else {
      handleAsync().catch(console.error);
    }
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
    idealStartDate,
    minEndDate,
    formMethodsRef,
  };
};

export default useQuestForm;
