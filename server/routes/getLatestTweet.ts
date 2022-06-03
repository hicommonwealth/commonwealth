import { Request, Response } from 'express';
import axios from 'axios';
import { DB } from '../database';
import { TWITTER_BEARER } from '../config';

// eslint-disable-next-line max-len

const getLatestTweet = async (models: DB, req: Request, res: Response) => {
  const twitterAccount = await models.SocialAccount.findOne({
    where: { provider: 'twitter', provider_username: req.query.handle }
  });

  if (twitterAccount) {
    // eslint-disable-next-line max-len
    const twitterURL = `https://api.twitter.com/2/users/${twitterAccount.provider_userid}/tweets?exclude=retweets,replies`;

    const requestHeaders = {
      'Authorization': `Bearer ${TWITTER_BEARER}`,
    };

    try {
      const { data: twitterResponse } = await axios(twitterURL, { method:'GET', headers:requestHeaders });
      res.json({
        status: 'Success',
        result: { ...twitterResponse },
      });
    } catch (e) {
      console.warn(e.response);
    }
  }
};

export default getLatestTweet;