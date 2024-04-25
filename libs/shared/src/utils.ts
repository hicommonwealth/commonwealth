export function foo() {}

export const slugify = (str: string): string => {
  // Remove any character that isn't a alphanumeric character or a
  // space, and then replace any sequence of spaces with dashes.
  if (!str) return '';

  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};
/* eslint-disable */

export const getThreadUrl = (
  thread: {
    chain: string;
    type_id?: string | number;
    id?: string | number;
    title?: string;
  },
  comment?: string | number,
): string => {
  const aId = thread.chain;
  const tId = thread.type_id || thread.id;
  const tTitle = thread.title ? `-${slugify(thread.title)}` : '';
  const cId = comment ? `?comment=${comment}` : '';

  return process.env.NODE_ENV === 'production'
    ? `https://commonwealth.im/${aId}/discussion/${tId}${tTitle.toLowerCase()}${cId}`
    : `http://localhost:8080/${aId}/discussion/${tId}${tTitle.toLowerCase()}${cId}`;
};
