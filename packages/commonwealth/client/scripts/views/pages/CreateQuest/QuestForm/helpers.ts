import { generateTopicIdentifiersFromUrl } from '@hicommonwealth/shared';
import {
  doesActionAllowChainId,
  doesActionAllowThreadId,
  doesActionAllowTokenTradeThreshold,
  doesActionAllowTopicId,
  doesActionRequireDiscordServerId,
  doesActionRequireGoalConfig,
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
  | 'chain'
  | 'threshold'
  | 'goal'
  | 'sso';

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
    if (doesActionRequireGoalConfig(action as QuestAction))
      return QuestActionContentIdScope.Goal;
    if (doesActionAllowThreadId(action as QuestAction))
      return QuestActionContentIdScope.Thread;
    if (doesActionAllowChainId(action as QuestAction))
      return QuestActionContentIdScope.Chain;
    if (doesActionRequireGroupId(action as QuestAction))
      return QuestActionContentIdScope.Group;
    if (doesActionAllowTokenTradeThreshold(action as QuestAction))
      return QuestActionContentIdScope.TokenTradeThreshold;
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
    case 'goal':
      return QuestActionContentIdScope.Goal;
    case 'chain':
      return QuestActionContentIdScope.Chain;
    case 'group':
      return QuestActionContentIdScope.Group;
    case 'threshold':
      return QuestActionContentIdScope.TokenTradeThreshold;
    case 'sso':
      return QuestActionContentIdScope.Sso;
    default:
      return QuestActionContentIdScope.Thread;
  }
};

export const buildContentIdFromIdentifier = (
  identifier: string, // can be a url or a string containing the identifier value
  idType: ContentIdType,
) => {
  if (idType === 'tweet_url' || idType === 'discord_server_id') {
    return `${idType}:${identifier}`;
  }
  if (idType === 'chain') {
    return `${idType}:${identifier}`;
  }
  if (idType === 'threshold') {
    return `${idType}:${identifier}`;
  }
  if (idType === 'goal') {
    return `${idType}:${identifier}`;
  }
  if (idType === 'sso') {
    return `${idType}:${identifier}`;
  }

  // this is used by all the remaining idType's below
  const urlObj = new URL(identifier);
  const searchParams = new URLSearchParams(urlObj.search);

  if (idType === 'comment') {
    return `${idType}:${parseInt(
      identifier.includes('discussion/comment/')
        ? urlObj.pathname.split('/').at(-1) || '' // get comment id from url pathname
        : searchParams.get('comment') || '', // get comment id from url search params
    )}`;
  }
  if (idType === 'thread') {
    return `${idType}:${parseInt(
      urlObj.pathname
        .split('discussion/')[1] // remove thread redirector path
        .split('-')[0],
    )}`;
  }
  if (idType === 'topic') {
    // check if url is in a redirect format
    if (identifier.includes(`${urlObj.origin}/discussion/topic/`)) {
      const topicId = parseInt(identifier.split('/').at(-1) || '');
      if (topicId) return `${idType}:${topicId}`;
    }

    // check if url is in a resolved format
    const topicIdentifier = generateTopicIdentifiersFromUrl(identifier);
    if (topicIdentifier?.topicId) return `${idType}:${topicIdentifier.topicId}`;
    throw new Error(`invalid topic url ${identifier}`);
  }
  if (idType === 'group') {
    return `${idType}:${parseInt(
      identifier.includes('group/')
        ? urlObj.pathname.split('/').at(-1) || '' // get group id from url pathname
        : searchParams.get('groupId') || '', // get group id from url search params
    )}`;
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
  if (idType === 'threshold') {
    return `${idOrURL}`;
  }
  if (idType === 'goal') {
    return `${idOrURL}`;
  }
  if (idType === 'sso') {
    return `${idOrURL}`;
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
    // config?.requires_goal_config || // hidden, will be set programatically
    config?.with_optional_chain_id ||
    config?.requires_group_id ||
    config?.with_optional_token_trade_threshold ||
    config?.with_optional_sso_type
  );
};
