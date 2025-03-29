import {
  QuestParticipationLimit,
  QuestParticipationPeriod,
} from '@hicommonwealth/schemas';
import { PRODUCTION_DOMAIN } from '@hicommonwealth/shared';
import clsx from 'clsx';
import { numberNonDecimalGTZeroValidationSchema } from 'helpers/formValidations/common';
import { doesActionRewardShareForReferrer } from 'helpers/quest';
import { splitCamelOrPascalCase } from 'helpers/string';
import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import React, { useEffect } from 'react';
import CWRepetitionCycleRadioButton, {
  useCWRepetitionCycleRadioButton,
} from 'views/components/component_kit/CWRepetitionCycleRadioButton';
import { ValidationFnProps } from 'views/components/component_kit/CWRepetitionCycleRadioButton/types';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { CWRadioButton } from 'views/components/component_kit/new_designs/cw_radio_button';
import { actionCopies } from '../../../QuestDetails/QuestActionCard/helpers';
import './QuestActionSubForm.scss';
import {
  QuestAction,
  QuestActionContentIdScope,
  QuestActionSubFormProps,
} from './types';

// these restrictions are only on client side, update per future requirements
const MAX_REPETITION_COUNTS = {
  PER_DAY: 4,
  PER_WEEK: 28,
  PER_MONTH: 120,
};

const QuestActionSubForm = ({
  isRemoveable = true,
  onRemove,
  errors,
  defaultValues,
  config,
  onChange,
  hiddenActions,
  internalRefs,
}: QuestActionSubFormProps) => {
  const actionOptions = [
    'CommunityCreated',
    'CommunityJoined',
    'ThreadCreated',
    'ThreadUpvoted',
    'CommentCreated',
    'CommentUpvoted',
    'WalletLinked',
    'SSOLinked',
    'TweetEngagement',
  ]
    .map((event) => ({
      value: event as QuestAction,
      label: splitCamelOrPascalCase(event),
    }))
    .filter(
      (action) =>
        !(hiddenActions || []).includes(action.value) &&
        action.value !== 'UserMentioned',
    );

  const contentIdInputConfig = {
    placeholders: {
      sampleThreadLink: `https://${PRODUCTION_DOMAIN}/discussion/25730`,
      sampleCommentLink: `https://${PRODUCTION_DOMAIN}/discussion/25730?comment=89775`,
      sampleTopicLink: `https://${PRODUCTION_DOMAIN}/common/discussions/Proposals`,
      twitterTweetUrl: `https://x.com/user/status/1904060455158428146`,
    },
    labels: {
      threadId: 'Thread Link (optional)',
      commentId: 'Comment Link (optional)',
      topicId: 'Topic Link (optional)',
      twitterTweetUrl: 'Tweet URL',
    },
  };

  const getContentIdInputLabel = () => {
    if (defaultValues?.contentIdScope === QuestActionContentIdScope.Thread) {
      if (config?.with_optional_thread_id) {
        return contentIdInputConfig.labels.threadId;
      }
      if (config?.with_optional_comment_id) {
        return contentIdInputConfig.labels.commentId;
      }
    }
    if (
      config?.with_optional_topic_id ||
      defaultValues?.contentIdScope === QuestActionContentIdScope.Topic
    ) {
      return contentIdInputConfig.labels.topicId;
    }

    if (config?.with_required_twitter_tweet_link) {
      return contentIdInputConfig.labels.twitterTweetUrl;
    }

    return 'Content Id';
  };

  const getContentIdInputPlaceholder = () => {
    if (defaultValues?.contentIdScope === QuestActionContentIdScope.Thread) {
      if (config?.with_optional_thread_id) {
        return contentIdInputConfig.placeholders.sampleThreadLink;
      }
      if (config?.with_optional_comment_id) {
        return contentIdInputConfig.placeholders.sampleCommentLink;
      }
    }
    if (
      config?.with_optional_topic_id ||
      defaultValues?.contentIdScope === QuestActionContentIdScope.Topic
    ) {
      return contentIdInputConfig.placeholders.sampleTopicLink;
    }

    if (config?.with_required_twitter_tweet_link) {
      return contentIdInputConfig.placeholders.twitterTweetUrl;
    }

    return 'Content Id';
  };

  const allowsContentId =
    config?.with_optional_comment_id ||
    config?.with_optional_thread_id ||
    config?.with_optional_topic_id ||
    config?.with_required_twitter_tweet_link;

  const repetitionCycleOptions = Object.keys(QuestParticipationPeriod).map(
    (k) => ({
      label: k,
      value: QuestParticipationPeriod[k],
    }),
  );

  const repetitionCycleValidatorFn = (props: ValidationFnProps) => {
    const participation_limit = defaultValues?.participationLimit;
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

  const repetitionCycleRadio = {
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
  };

  if (internalRefs) {
    internalRefs.runParticipationLimitValidator =
      triggerRepetitionCycleRadioValidation;
  }

  useRunOnceOnCondition({
    callback: () => {
      if (
        defaultValues?.participationTimesPerPeriod ||
        defaultValues?.participationPeriod
      ) {
        defaultValues?.participationTimesPerPeriod &&
          repetitionCycleRadioProps.repetitionCycleInputProps.onChange(
            defaultValues?.participationTimesPerPeriod,
          );
        defaultValues?.participationPeriod &&
          repetitionCycleRadioProps.repetitionCycleSelectListProps.onChange({
            value: defaultValues?.participationPeriod,
            label:
              Object.entries(QuestParticipationPeriod).find(
                ([_, v]) => v === defaultValues?.participationPeriod,
              )?.[0] || '',
          });
      }
    },
    shouldRun: true,
  });

  const participationTimesPerPeriod =
    repetitionCycleRadioProps.repetitionCycleInputProps.value;
  useEffect(() => {
    if (
      participationTimesPerPeriod === defaultValues?.participationTimesPerPeriod
    )
      return;
    onChange?.({
      participationTimesPerPeriod: participationTimesPerPeriod,
    });
  }, [
    participationTimesPerPeriod,
    defaultValues?.participationTimesPerPeriod,
    onChange,
  ]);

  const participationPeriod = repetitionCycleRadioProps
    .repetitionCycleSelectListProps.selected?.value as QuestParticipationPeriod;
  useEffect(() => {
    if (participationPeriod === defaultValues?.participationPeriod) return;
    onChange?.({
      participationPeriod: participationPeriod,
    });
  }, [participationPeriod, defaultValues?.participationPeriod, onChange]);

  return (
    <div className={clsx('QuestActionSubForm', { isRemoveable })}>
      {isRemoveable && (
        <CWIconButton
          iconName="close"
          onClick={onRemove}
          className="ml-auto cursor-pointer remove-btn"
        />
      )}

      <div className="repeatition-selector">
        <CWText type="caption" fontWeight="semiBold">
          Action Schedule
        </CWText>
        <CWRepetitionCycleRadioButton
          customError={repetitionCycleRadio.error}
          {...repetitionCycleRadio.props}
          className="radio-btn mt-8"
          value={QuestParticipationLimit.OncePerPeriod}
          groupName={`participationLimit-${defaultValues?.action}`}
          {...(defaultValues?.participationLimit ===
            QuestParticipationLimit.OncePerPeriod && {
            checked: true,
          })}
          onChange={(e) =>
            e.target.checked &&
            onChange?.({
              participationLimit: QuestParticipationLimit.OncePerPeriod,
            })
          }
        />
        <CWRadioButton
          className="radio-btn"
          value={QuestParticipationLimit.OncePerQuest}
          label="One time only"
          groupName={`participationLimit-${defaultValues?.action}`}
          {...(defaultValues?.participationLimit ===
            QuestParticipationLimit.OncePerQuest && {
            checked: true,
          })}
          onChange={(e) =>
            e.target.checked &&
            onChange?.({
              participationLimit: QuestParticipationLimit.OncePerQuest,
            })
          }
        />
      </div>

      <CWSelectList
        isClearable={false}
        label="Action"
        placeholder="Select an action"
        name="action"
        options={actionOptions}
        onChange={(newValue) =>
          newValue && onChange?.({ action: newValue.value, contentLink: '' })
        }
        {...(defaultValues?.action && {
          value: {
            value: defaultValues?.action as QuestAction,
            label: splitCamelOrPascalCase(defaultValues?.action),
          },
        })}
        customError={errors?.action}
        instructionalMessage={
          (defaultValues?.action === 'TweetEngagement' &&
            actionCopies.pre_reqs[defaultValues?.action as QuestAction](
              'admin',
            )) ||
          ''
        }
      />

      <div
        className={clsx(
          'grid-row',
          config?.requires_creator_points ? 'cols-2' : 'cols-1',
        )}
      >
        <CWTextInput
          label="Total Reward Points"
          placeholder="Points Earned"
          fullWidth
          {...(defaultValues?.rewardAmount && {
            defaultValue: defaultValues?.rewardAmount,
          })}
          onInput={(e) =>
            onChange?.({ rewardAmount: e?.target?.value?.trim() })
          }
          name="rewardAmount"
          customError={errors?.rewardAmount}
        />

        {config?.requires_creator_points && (
          <CWTextInput
            label={`${
              doesActionRewardShareForReferrer(
                defaultValues?.action as QuestAction,
              )
                ? 'Referrer'
                : 'Creater'
            } Reward Share`}
            placeholder="Points Earned"
            fullWidth
            {...(defaultValues?.creatorRewardAmount && {
              defaultValue: defaultValues?.creatorRewardAmount,
            })}
            onInput={(e) =>
              onChange?.({ creatorRewardAmount: e?.target?.value?.trim() })
            }
            name="creatorRewardAmount"
            customError={errors?.creatorRewardAmount}
            // eslint-disable-next-line max-len
            instructionalMessage={`Deducted from total reward points. ${
              doesActionRewardShareForReferrer(
                defaultValues?.action as QuestAction,
              )
                ? 'Only applied for referred user.'
                : ''
            }`}
          />
        )}
      </div>

      {config?.with_required_twitter_tweet_link && (
        <div className="grid-row cols-3">
          <CWTextInput
            key={`noOfLikes-${defaultValues?.action}`}
            name="noOfLikes"
            label="Likes Count"
            placeholder="0"
            fullWidth
            {...(defaultValues?.noOfLikes !== 'undefiend' && {
              defaultValue: defaultValues?.noOfLikes,
            })}
            onInput={(e) => onChange?.({ noOfLikes: e?.target?.value?.trim() })}
            customError={errors?.noOfLikes}
          />
          <CWTextInput
            key={`noOfRetweets-${defaultValues?.action}`}
            name="noOfRetweets"
            label="Retweets Count"
            placeholder="0"
            fullWidth
            {...(defaultValues?.noOfRetweets !== 'undefiend' && {
              defaultValue: defaultValues?.noOfRetweets,
            })}
            onInput={(e) =>
              onChange?.({ noOfRetweets: e?.target?.value?.trim() })
            }
            customError={errors?.noOfRetweets}
          />
          <CWTextInput
            key={`noOfReplies-${defaultValues?.action}`}
            name="noOfReplies"
            label="Replies Count"
            placeholder="0"
            fullWidth
            {...(defaultValues?.noOfReplies !== 'undefiend' && {
              defaultValue: defaultValues?.noOfReplies,
            })}
            onInput={(e) =>
              onChange?.({ noOfReplies: e?.target?.value?.trim() })
            }
            customError={errors?.noOfReplies}
          />
        </div>
      )}

      {config?.with_optional_thread_id && (
        <div className="content-id-type-selector">
          <CWText type="caption">Action Scope</CWText>
          <CWRadioButton
            className="radio-btn mt-8"
            value={QuestActionContentIdScope.Topic}
            label="Linked Topic"
            groupName={`contentIdScope-${defaultValues?.action}`}
            {...(defaultValues?.contentIdScope ===
              QuestActionContentIdScope.Topic && {
              checked: true,
            })}
            onChange={(e) =>
              e.target.checked &&
              onChange?.({
                contentLink: '',
                contentIdScope: QuestActionContentIdScope.Topic,
              })
            }
          />
          <CWRadioButton
            className="radio-btn"
            value={QuestActionContentIdScope.Thread}
            label="Linked Thread"
            groupName={`contentIdScope-${defaultValues?.action}`}
            {...(defaultValues?.contentIdScope ===
              QuestActionContentIdScope.Thread && {
              checked: true,
            })}
            onChange={(e) =>
              e.target.checked &&
              onChange?.({
                contentLink: '',
                contentIdScope: QuestActionContentIdScope.Thread,
              })
            }
          />
        </div>
      )}

      <div className={clsx('grid-row', allowsContentId ? 'cols-2' : 'cols-1')}>
        {allowsContentId && (
          <CWTextInput
            key={`contentIdScope-${defaultValues?.action}-${defaultValues?.contentIdScope}`}
            name="contentLink"
            label={getContentIdInputLabel()}
            placeholder={getContentIdInputPlaceholder()}
            fullWidth
            {...(defaultValues?.contentLink && {
              defaultValue: defaultValues?.contentLink,
            })}
            onInput={(e) =>
              onChange?.({ contentLink: e?.target?.value?.trim() })
            }
            customError={errors?.contentLink}
          />
        )}

        <CWTextInput
          label="Instructions Link (optional)"
          name="instructionsLink"
          placeholder="https://example.com"
          fullWidth
          {...(defaultValues?.instructionsLink && {
            defaultValue: defaultValues?.instructionsLink,
          })}
          onInput={(e) =>
            onChange?.({ instructionsLink: e?.target?.value?.trim() })
          }
          customError={errors?.instructionsLink}
        />
      </div>
    </div>
  );
};

export default QuestActionSubForm;
