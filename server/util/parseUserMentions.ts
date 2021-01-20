export const parseUserMentions = (text, isMarkdown: boolean): any[] => {
  // Extract links to Commonwealth profiles, so they can be processed by the server as mentions
  if (!text) return [];
  const regexp = RegExp('\\[\\@.+?\\]\\(.+?\\)', 'g');
  if (isMarkdown) {
    const matches = text.match(regexp);
    if (matches && matches.length > 0) {
      return matches.map((match) => {
        const chunks = match.slice(0, match.length - 1).split('/');
        const refIdx = chunks.indexOf('account');
        return [chunks[refIdx - 1], chunks[refIdx + 1]];
      });
    }
    return [];
  } else {
    return text.ops
      .filter((op) => {
        return op.attributes?.link?.length > 0 && typeof op.insert === 'string' && op.insert?.slice(0, 1) === '@';
      })
      .map((op) => {
        const chunks = op.attributes.link.split('/');
        const refIdx = chunks.indexOf('account');
        return [chunks[refIdx - 1], chunks[refIdx + 1]];
      });
  }
};
