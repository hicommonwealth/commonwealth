import { re_weburl } from 'lib/url-validation';
import { Link, LinkSource } from 'models/Thread';

// eslint-disable-next-line max-len

export function detectURL(str: string) {
  if (str.slice(0, 4) !== 'http') str = `http://${str}`; // no https required because this is only used for regex match
  return !!str.match(re_weburl);
}

export const filterLinks = (links: Link[] = [], source: LinkSource) => {
  return links?.filter((l) => l?.source === source);
};

export const getAddedAndDeleted = <T>(
  finalArr: T[],
  initialArr: T[],
  key: keyof T = 'id' as keyof T,
) => {
  const toAdd = finalArr.reduce((acc, curr) => {
    const wasSelected = initialArr.find((obj) => obj[key] === curr[key]);

    if (wasSelected) {
      return acc;
    }

    return [...acc, curr];
  }, []);

  const toDelete = initialArr.reduce((acc, curr) => {
    const isSelected = finalArr.find((obj) => obj[key] === curr[key]);

    if (isSelected) {
      return acc;
    }

    return [...acc, curr];
  }, []);

  return { toAdd, toDelete };
};
