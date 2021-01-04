import { re_weburl } from 'lib/url-validation';

export const parseMentionsForServer = (text, isMarkdown) => {
  // Extract links to Commonwealth profiles, so they can be processed by the server as mentions
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

export function detectURL(str: string) {
  if (str.slice(0, 4) !== 'http') str = `http://${str}`;
  return !!str.match(re_weburl);
}

export const getLinkTitle = async (url: string) => {
  if (url.slice(0, 4) !== 'http') url = `http://${url}`;
  const response = await fetch(`https://cors-anywhere.herokuapp.com/${url}`);
  if (response.status === 404) throw new Error(`404: ${url} Not Found`);
  if (response.status === 500) throw new Error(`500: ${url} Server Error`);
  if (response.status === 200) {
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    console.log(doc);
    const title = doc.querySelectorAll('title')[0];
    if (title) return title.innerText;
  }
};
