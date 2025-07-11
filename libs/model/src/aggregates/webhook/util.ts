import { Community } from '@hicommonwealth/schemas';
import { getDecodedString, PRODUCTION_DOMAIN } from '@hicommonwealth/shared';
import z from 'zod';
import { config } from '../../config';

export const REGEX_IMAGE =
  /\b(https?:\/\/\S*?\.(?:png|jpe?g|gif)(?:\?(?:(?:(?:[\w_-]+=[\w_-]+)(?:&[\w_-]+=[\w_-]+)*)|(?:[\w_-]+)))?)\b/;

export function getPreviewImageUrl(
  community: z.infer<typeof Community>,
  objectBody?: string,
) {
  // case 1: embedded image in object body
  if (objectBody) {
    const matches = objectBody.match(REGEX_IMAGE);
    if (matches) {
      return { previewImageUrl: matches[0], previewImageAltText: 'Embedded' };
    }
  }

  // case 2: community icon
  if (community.icon_url) {
    const previewImageUrl = community.icon_url.match(`^(http|https)://`)
      ? community.icon_url
      : `https://${PRODUCTION_DOMAIN}${community.icon_url}`;
    const previewImageAltText = `${community.name}`;
    return { previewImageUrl, previewImageAltText };
  }

  // case 3: default Common logo
  return {
    previewImageUrl: config.DEFAULT_COMMONWEALTH_LOGO,
    previewImageAltText: 'Commonwealth',
  };
}

export function getRenderedTitle(threadTitle: string): string {
  return getDecodedString(threadTitle);
}
