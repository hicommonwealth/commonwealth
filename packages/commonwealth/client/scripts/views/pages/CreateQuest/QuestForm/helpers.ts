export const buildContentIdFromURL = (
  url: string,
  idType: 'comment' | 'thread',
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
};

export const buildURLFromContentId = (
  id: string,
  idType: 'comment' | 'thread',
) => {
  if (idType === 'thread') return `${window.location.origin}/discussion/${id}`;
  if (idType === 'comment') {
    return `${window.location.origin}/discussion/comment/${id}`;
  }
};
