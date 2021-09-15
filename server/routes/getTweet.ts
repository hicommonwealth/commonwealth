import { Request, Response } from 'express';
import axios from 'axios';
import { DB } from '../database';

// eslint-disable-next-line max-len
const BEARER_TOKEN = 'AAAAAAAAAAAAAAAAAAAAAAARTQEAAAAAmobQU2AuZubo2rVFQ%2FWWzLgjLIQ%3Dcp1x7fYEVUeP7wVrgl7pPZTOXi1k3yrZ4vYxYjyeY4gGNvq6J0'; // TWITTER_BEARER_TOKEN

const getLatestTweet = async (models: DB, req: Request, res: Response) => {
  const twitterAccount = await models.SocialAccount.findOne({
    where: { provider: 'twitter', provider_username: req.query.handle }
  });

  if (twitterAccount) {
    // eslint-disable-next-line max-len
    const twitterURL = `https://api.twitter.com/2/users/${twitterAccount.provider_userid}/tweets?exclude=retweets,replies`;

    const requestHeaders = {
      'Authorization': `Bearer ${BEARER_TOKEN}`,
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
