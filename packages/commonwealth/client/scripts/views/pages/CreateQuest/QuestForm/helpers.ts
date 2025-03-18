import axios from 'axios';
import { SERVER_URL } from 'state/api/config';

export type ContentIdType = 'comment' | 'thread' | 'topic';

export const buildContentIdFromURL = async (
  url: string,
  idType: ContentIdType,
) => {
  if (idType === 'comment') {
    return `${idType}:${parseInt(
      url.includes('discussion/comment/')
        ? url.split('discussion/comment/')[1] // remove comment redirector path
        : url.split('?comment=')[1], // remove remove query string param
    )}`;
  }
  if (idType === 'thread') {
    return `${idType}:${parseInt(
      url
        .split('?')[0] // remove query string
        .split('discussion/')[1] // remove thread redirector path
        .split('-')[0],
    )}`;
  }
  if (idType === 'topic') {
    const foundId = parseInt(
      `${url.split('?')[0]?.split('/').filter(Boolean).at(-1)}`,
    );

    if (foundId) return `${idType}:${foundId}`;

    const communityId = url?.split('/')?.filter?.(Boolean)?.at?.(2) || '';
    const topicName = decodeURIComponent(
      url?.split('/')?.filter(Boolean)?.at(4)?.split('?')?.at(0) || '',
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
  }
};

export const buildURLFromContentId = (id: string, idType: ContentIdType) => {
  if (idType === 'thread') return `${window.location.origin}/discussion/${id}`;
  if (idType === 'comment') {
    return `${window.location.origin}/discussion/comment/${id}`;
  }
  if (idType === 'topic') {
    return `${window.location.origin}/discussion/topic/${id}`;
  }
  return '';
};
