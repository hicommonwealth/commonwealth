import axios from 'axios';
import {
  doesActionAllowChainId,
  doesActionAllowThreadId,
  doesActionAllowTopicId,
  doesActionRequireDiscordServerURL,
  doesActionRequireTwitterTweetURL,
} from 'helpers/quest';
import { SERVER_URL } from 'state/api/config';
import { QuestAction, QuestActionContentIdScope } from './QuestActionSubForm';

export type ContentIdType =
  | 'comment'
  | 'thread'
  | 'topic'
  | 'tweet_url'
  | 'discord_server_url'
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
    if (doesActionRequireDiscordServerURL(action as QuestAction))
      return QuestActionContentIdScope.DiscordServer;
    if (doesActionAllowThreadId(action as QuestAction))
      return QuestActionContentIdScope.Thread;
    if (doesActionAllowChainId(action as QuestAction))
      return QuestActionContentIdScope.Chain;
    return undefined;
  }

  const scope = contentId.split(':')[0];
  switch (scope) {
    case 'topic':
      return QuestActionContentIdScope.Topic;
    case 'tweet_url':
      return QuestActionContentIdScope.TwitterTweet;
    case 'discord_server_url':
      return QuestActionContentIdScope.DiscordServer;
    case 'chain':
      return QuestActionContentIdScope.Chain;
    default:
      return QuestActionContentIdScope.Thread;
  }
};

export const buildContentIdFromIdentifier = async (
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
    const foundId = parseInt(
      `${identifier.split('?')[0]?.split('/').filter(Boolean).at(-1)}`,
    );

    if (foundId) return `${idType}:${foundId}`;

    const communityId =
      identifier?.split('/')?.filter?.(Boolean)?.at?.(2) || '';
    const topicName = decodeURIComponent(
      identifier?.split('/')?.filter(Boolean)?.at(4)?.split('?')?.at(0) || '',
    );
    // Note: This is not a good approach and is only added temporarily.
    // The core problem here is that we don't get topic ids from topic page urls, so we need to fetch the topics list
    // for the community and then find a topic which matches the topic name from url, and then extract its id for api
    // storage. The solution is to update topic urls to store topic ids, and should be done in a followup
    // https://github.com/hicommonwealth/commonwealth/issues/11546
    const communityTopics = (
      await axios.get(
        // eslint-disable-next-line max-len
        `${SERVER_URL}/internal/trpc/community.getTopics?batch=1&input=%7B%220%22%3A%7B%22community_id%22%3A%22${communityId}%22%7D%7D`,
      )
    ).data?.[0]?.result?.data;
    const foundTopic = communityTopics?.find(
      (t) => t.name.toLowerCase().trim() === topicName.toLowerCase().trim(),
    );
    if (foundTopic) return `${idType}:${foundTopic.id}`;
    throw new Error(`invalid topic url ${identifier}`);
  }
  if (idType === 'tweet_url' || idType === 'discord_server_url') {
    return `${idType}:${identifier}`;
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
  if (idType === 'discord_server_url') return `${idOrURL}${params}`;
  if (idType === 'topic') {
    return `${origin}/discussion/topic/${idOrURL}${params}`;
  }
  if (idType === 'chain') {
    return `${idOrURL}`;
  }

  return '';
};
