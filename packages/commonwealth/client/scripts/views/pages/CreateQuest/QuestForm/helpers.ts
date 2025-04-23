import { generateTopicIdentifiersFromUrl } from '@hicommonwealth/shared';
import {
  doesActionAllowChainId,
  doesActionAllowThreadId,
  doesActionAllowTopicId,
  doesActionRequireDiscordServerId,
  doesActionRequireGroupId,
  doesActionRequireTwitterTweetURL,
} from 'helpers/quest';
import {
  QuestAction,
  QuestActionContentIdScope,
  QuestActionSubFormConfig,
} from './QuestActionSubForm';

export type ContentIdType =
  | 'comment'
  | 'thread'
  | 'topic'
  | 'group'
  | 'tweet_url'
  | 'discord_server_id'
  | 'chain';

export const inferContentIdTypeFromContentId = (
  action: QuestAction,
  contentId?: string,
) => {
  if (!contentId) {
    if (doesActionAllowTopicId(action as QuestAction))
      return QuestActionContentIdScope.Topic;
    if (doesActionRequireTwitterTweetURL(action as QuestAction))
      return QuestActionContentIdScope.TwitterTweet;
    if (doesActionRequireDiscordServerId(action as QuestAction))
      return QuestActionContentIdScope.DiscordServer;
    if (doesActionAllowThreadId(action as QuestAction))
      return QuestActionContentIdScope.Thread;
    if (doesActionAllowChainId(action as QuestAction))
      return QuestActionContentIdScope.Chain;
    if (doesActionRequireGroupId(action as QuestAction))
      return QuestActionContentIdScope.Group;
    return undefined;
  }

  const scope = contentId.split(':')[0];
  switch (scope) {
    case 'topic':
      return QuestActionContentIdScope.Topic;
    case 'tweet_url':
      return QuestActionContentIdScope.TwitterTweet;
    case 'discord_server_id':
      return QuestActionContentIdScope.DiscordServer;
    case 'chain':
      return QuestActionContentIdScope.Chain;
    case 'group':
      return QuestActionContentIdScope.Group;
    default:
      return QuestActionContentIdScope.Thread;
  }
};

export const buildContentIdFromIdentifier = (
  identifier: string, // can be a url or a string containing the identifier value
  idType: ContentIdType,
) => {
  if (idType === 'comment') {
    return `${idType}:${parseInt(
      identifier.includes('discussion/comment/')
        ? identifier.split('discussion/comment/')[1] // remove comment redirector path
        : identifier.split('?comment=')[1], // remove remove query string param
    )}`;
  }
  if (idType === 'thread') {
    return `${idType}:${parseInt(
      identifier
        .split('?')[0] // remove query string
        .split('discussion/')[1] // remove thread redirector path
        .split('-')[0],
    )}`;
  }
  if (idType === 'topic') {
    // check if url is in a redirect format
    const urlObj = new URL(identifier);
    if (identifier.includes(`${urlObj.origin}/discussion/topic/`)) {
      const topicId = parseInt(identifier.split('/').at(-1) || '');
      if (topicId) return `${idType}:${topicId}`;
    }

    // check if url is in a resolved format
    const topicIdentifier = generateTopicIdentifiersFromUrl(identifier);
    if (topicIdentifier?.topicId) return `${idType}:${topicIdentifier.topicId}`;
    throw new Error(`invalid topic url ${identifier}`);
  }
  if (idType === 'tweet_url' || idType === 'discord_server_id') {
    return `${idType}:${identifier}`;
  }
  if (idType === 'group') {
    return `${idType}:${parseInt(
      identifier.includes('group/')
        ? new URL(identifier).pathname.split('/').at(-1) || '' // get group id from url pathname
        : new URLSearchParams(new URL(identifier).search).get('groupId') || '', // get group id from url search params
    )}`;
  }
  if (idType === 'chain') {
    return `${idType}:${identifier}`;
  }
};

export const buildRedirectURLFromContentId = (
  contentId: string,
  withParams = {},
) => {
  const [id, ...rest] = contentId.split(':');
  const idType = id as ContentIdType;
  const idOrURL = Array.isArray(rest) ? rest.join(':') : rest;

  const origin = window.location.origin;
  const params =
    Object.keys(withParams || {}).length > 0
      ? `?${new URLSearchParams(withParams).toString()}`
      : '';

  if (idType === 'thread') return `${origin}/discussion/${idOrURL}${params}`;
  if (idType === 'comment')
    return `${origin}/discussion/comment/${idOrURL}${params}`;
  if (idType === 'tweet_url') return `${idOrURL}${params}`;
  if (idType === 'discord_server_id') return `${idOrURL}${params}`;
  if (idType === 'topic') {
    return `${origin}/discussion/topic/${idOrURL}${params}`;
  }
  if (idType === 'chain') {
    return `${idOrURL}`;
  }
  if (idType === 'group') {
    return `${origin}/group/${idOrURL}${params}`;
  }

  return '';
};

export const doesConfigAllowContentIdField = (
  config: QuestActionSubFormConfig,
) => {
  return (
    config?.with_optional_comment_id ||
    config?.with_optional_thread_id ||
    config?.with_optional_topic_id ||
    config?.requires_twitter_tweet_link ||
    config?.requires_discord_server_id ||
    config?.with_optional_chain_id ||
    config?.requires_group_id
  );
};
