import { PRODUCTION_DOMAIN } from '@hicommonwealth/shared';
import React from 'react';
import { fetchCachedNodes } from 'state/api/nodes';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { doesConfigAllowContentIdField } from '../../helpers';
import { QuestActionContentIdScope } from '../types';
import { SpecialCaseDynamicFieldsProps } from './types';

const ContentIdInput = ({
  defaultValues,
  errors,
  onChange,
  config,
}: SpecialCaseDynamicFieldsProps) => {
  const hasContentIdField = config
    ? doesConfigAllowContentIdField(config)
    : false;

  if (!hasContentIdField) return;

  const inputConfig = {
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
  };

  const getContentIdInputConfig = () => {
    if (defaultValues?.contentIdScope === QuestActionContentIdScope.Thread) {
      if (config?.with_optional_thread_id) {
        return {
          label: inputConfig.labels.threadId,
          placeholder: inputConfig.placeholders.sampleThreadLink,
        };
      }
      if (config?.with_optional_comment_id) {
        return {
          label: inputConfig.labels.commentId,
          placeholder: inputConfig.placeholders.sampleCommentLink,
        };
      }
    }
    if (
      config?.with_optional_topic_id ||
      defaultValues?.contentIdScope === QuestActionContentIdScope.Topic
    ) {
      return {
        label: inputConfig.labels.topicId,
        placeholder: inputConfig.placeholders.sampleTopicLink,
      };
    }

    if (config?.requires_twitter_tweet_link) {
      return {
        label: inputConfig.labels.twitterTweetUrl,
        placeholder: inputConfig.placeholders.twitterTweetUrl,
      };
    }

    if (config?.requires_discord_server_id) {
      return {
        label: inputConfig.labels.discordServerId,
        placeholder: inputConfig.placeholders.discordServerId,
      };
    }

    if (config?.with_optional_chain_id) {
      return {
        label: inputConfig.labels.chainId,
        placeholder: inputConfig.placeholders.chainId,
      };
    }

    if (config?.requires_group_id) {
      return {
        label: inputConfig.labels.groupId,
        placeholder: inputConfig.placeholders.groupId,
      };
    }

    return { label: 'Content Id', placeholder: 'Content Id' };
  };

  const communityChainNodeSelectInputOptions = fetchCachedNodes()
    ?.filter((node) => node?.ethChainId || node?.cosmosChainId)
    ?.map((node) => ({
      label: `${node.name} - (Chain Id = ${node?.ethChainId || node?.cosmosChainId})`,
      value: node.id,
    }))
    ?.sort((a, b) => a.label.localeCompare(b.label));

  if (config?.with_optional_chain_id) {
    <CWSelectList
      isClearable={true}
      backspaceRemovesValue
      key={`contentIdentifier-${defaultValues?.action}`}
      name="contentIdentifier"
      label="Chain Node"
      placeholder="Select a chain node"
      containerClassname="span-3"
      options={communityChainNodeSelectInputOptions}
      onChange={(newValue) =>
        onChange?.({ contentIdentifier: `${newValue?.value || ''}` })
      }
      {...(defaultValues?.contentIdentifier && {
        value: {
          value: parseInt(`${defaultValues?.contentIdentifier}`),
          label: `${
            communityChainNodeSelectInputOptions?.find(
              (x) =>
                x.value === parseInt(`${defaultValues?.contentIdentifier}`),
            )?.label
          }`,
        },
      })}
      customError={errors?.contentIdentifier}
    />;
  }

  return (
    <CWTextInput
      key={`contentIdentifier-${defaultValues?.action}-${defaultValues?.contentIdScope}`}
      name="contentIdentifier"
      label={getContentIdInputConfig().label}
      placeholder={getContentIdInputConfig().placeholder}
      containerClassName="span-3"
      fullWidth
      {...(defaultValues?.contentIdentifier && {
        defaultValue: defaultValues?.contentIdentifier,
      })}
      onInput={(e) =>
        onChange?.({ contentIdentifier: e?.target?.value?.trim() })
      }
      customError={errors?.contentIdentifier}
    />
  );
};

export default ContentIdInput;
