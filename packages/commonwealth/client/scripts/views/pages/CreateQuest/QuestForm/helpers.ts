import { generateTopicIdentifiersFromUrl } from '@hicommonwealth/shared';

export type ContentIdType = 'comment' | 'thread' | 'topic';

export const buildContentIdFromURL = (url: string, idType: ContentIdType) => {
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
    const topicIdentifier = generateTopicIdentifiersFromUrl(url);

    if (topicIdentifier?.topicId) return `${idType}:${topicIdentifier.topicId}`;

    throw new Error(`invalid topic url ${url}`);
  }
};

export const buildURLFromContentId = (
  id: string,
  idType: ContentIdType,
  withParams = {},
) => {
  if (idType === 'thread') return `${window.location.origin}/discussion/${id}`;
  if (idType === 'comment') {
    return `${window.location.origin}/discussion/comment/${id}`;
  }
  if (idType === 'topic') {
    const params =
      Object.keys(withParams || {}).length > 0
        ? new URLSearchParams(withParams).toString()
        : '';
    return `${window.location.origin}/discussion/topic/${id}${params ? `?${params}` : ''}`;
  }
  return '';
};
