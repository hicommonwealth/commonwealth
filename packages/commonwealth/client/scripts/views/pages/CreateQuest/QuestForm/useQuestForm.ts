import {
  QuestEvents,
  QuestParticipationLimit,
  QuestParticipationPeriod,
} from '@hicommonwealth/schemas';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { numberNonDecimalGTZeroValidationSchema } from 'helpers/formValidations/common';
import { calculateRemainingPercentageChangeFractional } from 'helpers/number';
import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import moment from 'moment';
import { useCommonNavigate } from 'navigation/helpers';
import { useRef, useState } from 'react';
import {
  useCreateQuestMutation,
  useUpdateQuestMutation,
} from 'state/api/quests';
import { useCWRepetitionCycleRadioButton } from 'views/components/component_kit/CWRepetitionCycleRadioButton';
import { ValidationFnProps } from 'views/components/component_kit/CWRepetitionCycleRadioButton/types';
import { CWFormRef } from 'views/components/component_kit/new_designs/CWForm';
import { openConfirmation } from 'views/modals/confirmation_modal';
import { z } from 'zod';
import { QuestAction } from './QuestActionSubForm';
import { doesActionRequireCreatorReward } from './QuestActionSubForm/helpers';
import { useQuestActionMultiFormsState } from './QuestActionSubForm/useMultipleQuestActionForms';
import './QuestForm.scss';
import {
  QuestActionSubFormValuesWithCreatorPoints,
  QuestFormProps,
} from './types';
import { questFormValidationSchema } from './validation';

const MIN_ACTIONS_LIMIT = 1;
const MAX_ACTIONS_LIMIT = Object.values(QuestEvents).length; // = 8 max actions
// these restrictions are only on client side, update per future requirements
const MAX_REPETITION_COUNTS = {
  PER_DAY: 4,
  PER_WEEK: 28,
  PER_MONTH: 120,
};

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
        if (
          initialValues.participation_limit !==
          QuestParticipationLimit.OncePerQuest
        ) {
          initialValues.participation_times_per_period &&
            repetitionCycleRadioProps.repetitionCycleInputProps.onChange(
              initialValues.participation_times_per_period,
            );
          initialValues.participation_period &&
            repetitionCycleRadioProps.repetitionCycleSelectListProps.onChange({
              value: initialValues.participation_period,
              label:
                Object.entries(QuestParticipationPeriod).find(
                  ([_, v]) => v === initialValues.participation_period,
                )?.[0] || '',
            });
        }

        if (initialValues?.subForms?.length > 0) {
          setQuestActionSubForms([
            ...initialValues.subForms.map((subForm, index) => ({
              id: index + 1,
              values: {
                action: subForm.action as QuestAction,
                actionLink: subForm.actionLink || '',
                rewardAmount: subForm.rewardAmount,
                ...((subForm as QuestActionSubFormValuesWithCreatorPoints)
                  ?.creatorRewardAmount && {
                  creatorRewardAmount: (
                    subForm as QuestActionSubFormValuesWithCreatorPoints
                  ).creatorRewardAmount,
                }),
              },
              errors: {},
              config: {
                requires_creator_points: doesActionRequireCreatorReward(
                  subForm.action as QuestAction,
                ),
              },
            })),
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
      numberNonDecimalGTZeroValidationSchema.parse(`${input}`);

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

  const handleCreateQuest = (
    values: z.infer<typeof questFormValidationSchema>,
  ) => {
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
              amount_multiplier: 0,
            })),
          });
        }

        notifySuccess('Quest created!');

        navigate('/explore');
      } catch (e) {
        console.error(e);

        if (e.message.includes('must be at least 0 days in the future')) {
          notifyError('Start date must be a future date');
          return;
        }
        if (e?.message?.includes?.('must not exist')) {
          notifyError('Quest with provided name already exists!');
          return;
        }
        notifyError('Failed to create quest!');
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

  const handleUpdateQuest = (
    values: z.infer<typeof questFormValidationSchema>,
  ) => {
    const subFormErrors = validateSubForms();
    const repetitionCycleRadioBtnError =
      triggerRepetitionCycleRadioValidation();

    if (subFormErrors || repetitionCycleRadioBtnError || !questId) return;

    const handleAsync = async () => {
      try {
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
          image_url: values.image,
          community_id: values?.community?.value || undefined,
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

        notifySuccess('Quest updated!');

        navigate(`/quest/${questId}`, {}, values?.community?.value); // redirect to quest details page after update
      } catch (e) {
        console.error(e);

        if (e.message.includes('must be at least 0 days in the future')) {
          notifyError('Start date must be a future date');
          return;
        }
        if (e?.message?.includes?.('must not exist')) {
          notifyError('Quest with provided name already exists!');
          return;
        }
        notifyError('Failed to update quest!');
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

  const handleSubmit = (values: z.infer<typeof questFormValidationSchema>) => {
    if (mode === 'create') handleCreateQuest(values);
    if (mode === 'update') handleUpdateQuest(values);
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
