import { re_weburl } from 'lib/url-validation';
import { Link, LinkSource } from 'models/Thread';

export function detectURL(str: string) {
  if (str.slice(0, 4) !== 'http') str = `http://${str}`; // no https required because this is only used for regex match
  return !!str.match(re_weburl);
}

export const filterLinks = (links: Link[] = [], source: LinkSource) => {
  return links.filter((l) => l?.source === source);
};
