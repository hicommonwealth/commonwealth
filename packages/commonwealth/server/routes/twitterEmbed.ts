import { DB } from '../models';
import { success } from '../types';
import axios from 'axios';
import { AppError } from '../../../common-common/src/errors';

export const twitterEmbed = async (models: DB, req: any, res: any) => {
  const url = req.query.url;
  if (typeof url !== 'string' || !url.startsWith('https://twitter.com/')) {
    throw new AppError('invalid twitter URL');
  }

  const embedUrl = 'https://publish.twitter.com/oembed';
  const embedInfo = await axios.get(embedUrl, {
    params: {
      url,
    },
  });

  return success(res, embedInfo.data);
};
