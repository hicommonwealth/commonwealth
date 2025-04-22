import {
  QuestParticipationLimit,
  QuestParticipationPeriod,
} from '@hicommonwealth/schemas';
import { PRODUCTION_DOMAIN } from '@hicommonwealth/shared';
import { numberNonDecimalGTZeroValidationSchema } from 'helpers/formValidations/common';
import { splitCamelOrPascalCase } from 'helpers/string';
import useRunOnceOnCondition from 'hooks/useRunOnceOnCondition';
import { useEffect } from 'react';
import { fetchCachedNodes } from 'state/api/nodes';
import { useCWRepetitionCycleRadioButton } from 'views/components/component_kit/CWRepetitionCycleRadioButton';
import { ValidationFnProps } from 'views/components/component_kit/CWRepetitionCycleRadioButton/types';
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

const useQuestActionSubForm = ({
  defaultValues,
  config,
  onChange,
  availableActions,
  hiddenActions,
  internalRefs,
}: QuestActionSubFormProps) => {
  const actionOptions = availableActions
    .map((event) => ({
      value: event as QuestAction,
      label: splitCamelOrPascalCase(event),
    }))
    .filter(
      (action) =>
        !(hiddenActions || []).includes(action.value) &&
        action.value !== 'UserMentioned',
    );

  const inputConfigs = {
    contentId: {
      placeholders: {
        sampleThreadLink: `https://${PRODUCTION_DOMAIN}/discussion/25730`,
        sampleCommentLink: `https://${PRODUCTION_DOMAIN}/discussion/25730?comment=89775`,
        sampleTopicLink: `https://${PRODUCTION_DOMAIN}/common/discussions/Proposals`,
        twitterTweetUrl: `https://x.com/user/status/1904060455158428146`,
        discordServerId: `0xxxxxxxxxxxxxxxx0`,
        chainId: `Select community chain`,
        groupId: `https://${PRODUCTION_DOMAIN}/common/members?tab=groups&groupId=1234`,
      },
      labels: {
        threadId: 'Thread Link (optional)',
        commentId: 'Comment Link (optional)',
        topicId: 'Topic Link (optional)',
        twitterTweetUrl: 'Tweet URL',
        chainId: 'Chain Id (optional)',
        discordServerId: 'Discord Server Id',
        groupId: 'Group Link',
      },
    },
    startLink: {
      placeholders: {
        discordServerUrl: `https://discord.gg/commonwealth`,
      },
      labels: {
        discordServerUrl: 'Discord Server Url',
      },
    },
  };

  const getContentIdInputConfig = () => {
    if (defaultValues?.contentIdScope === QuestActionContentIdScope.Thread) {
      if (config?.with_optional_thread_id) {
        return {
          label: inputConfigs.contentId.labels.threadId,
          placeholder: inputConfigs.contentId.placeholders.sampleThreadLink,
        };
      }
      if (config?.with_optional_comment_id) {
        return {
          label: inputConfigs.contentId.labels.commentId,
          placeholder: inputConfigs.contentId.placeholders.sampleCommentLink,
        };
      }
    }
    if (
      config?.with_optional_topic_id ||
      defaultValues?.contentIdScope === QuestActionContentIdScope.Topic
    ) {
      return {
        label: inputConfigs.contentId.labels.topicId,
        placeholder: inputConfigs.contentId.placeholders.sampleTopicLink,
      };
    }

    if (config?.requires_twitter_tweet_link) {
      return {
        label: inputConfigs.contentId.labels.twitterTweetUrl,
        placeholder: inputConfigs.contentId.placeholders.twitterTweetUrl,
      };
    }

    if (config?.requires_discord_server_id) {
      return {
        label: inputConfigs.contentId.labels.discordServerId,
        placeholder: inputConfigs.contentId.placeholders.discordServerId,
      };
    }

    if (config?.with_optional_chain_id) {
      return {
        label: inputConfigs.contentId.labels.chainId,
        placeholder: inputConfigs.contentId.placeholders.chainId,
      };
    }

    if (config?.requires_group_id) {
      return {
        label: inputConfigs.contentId.labels.groupId,
        placeholder: inputConfigs.contentId.placeholders.groupId,
      };
    }

    return { label: 'Content Id', placeholder: 'Content Id' };
  };

  const getStartLinkInputConfig = () => {
    if (config?.requires_discord_server_id) {
      return {
        label: inputConfigs.startLink.labels.discordServerUrl,
        placeholder: inputConfigs.startLink.placeholders.discordServerUrl,
      };
    }

    return { label: 'Start Link', placeholder: 'https://example.com' };
  };

  const hasContentIdField =
    config?.with_optional_comment_id ||
    config?.with_optional_thread_id ||
    config?.with_optional_topic_id ||
    config?.requires_twitter_tweet_link ||
    config?.requires_discord_server_id ||
    config?.with_optional_chain_id ||
    config?.requires_group_id;

  const communityChainNodeSelectInputOptions = fetchCachedNodes()
    ?.filter((node) => node?.ethChainId || node?.cosmosChainId)
    ?.map((node) => ({
      label: `${node.name} - (Chain Id = ${node?.ethChainId || node?.cosmosChainId})`,
      value: node.id,
    }))
    ?.sort((a, b) => a.label.localeCompare(b.label));

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

  const doesActionPreventRepetition =
    typeof config?.is_action_repeatable !== 'undefined'
      ? !config?.is_action_repeatable
      : false;

  return {
    doesActionPreventRepetition,
    repetitionCycleRadio,
    actionOptions,
    inputConfigs: {
      contentId: getContentIdInputConfig(),
      startLink: getStartLinkInputConfig(),
    },
    hasContentIdField,
    communityChainNodeSelectInputOptions,
  };
};

export default useQuestActionSubForm;
