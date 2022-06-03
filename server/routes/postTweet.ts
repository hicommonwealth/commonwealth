import { NextFunction, Request, Response, text } from 'express';
import axios from 'axios';
import { DB } from '../database';
import { TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET } from '../config';
import { TwitterClient } from 'twitter-api-client';

// eslint-disable-next-line max-len
export const Errors = {
  NeedAddress: 'Must provide address',
  NeedTweet: 'No tweet provided',
  NeedSocialAccout: 'No valid social account found',
  NeedLoggedIn: 'No user found, must be logged in',
  NoTwitterName: 'No twitter handle supplied',
};

const postTweet = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error(Errors.NeedLoggedIn));
  }
  if (!req.body.tweet) {
    return next(new Error(Errors.NeedTweet));
  }
  if (!req.body.address) {
    return next(new Error(Errors.NeedAddress));
  }
  if (!req.body.handle) {
    return next(new Error(Errors.NoTwitterName));
  }

  const twitterAccount = await models.SocialAccount.scope('withPrivateData').findOne({
    where: { provider: 'twitter', provider_username: req.body.handle }
  });

  if (!twitterAccount) {
    return next(new Error(Errors.NeedSocialAccout));
  }

  if (twitterAccount) {
    // eslint-disable-next-line max-len
    const twitterURL = `https://api.twitter.com/1.1/statuses/update.json`;

    const twitterClient = new TwitterClient({
      apiKey: TWITTER_CLIENT_ID,
      apiSecret: TWITTER_CLIENT_SECRET,
      accessToken: twitterAccount.access_token,
      accessTokenSecret: twitterAccount.access_token_secret,
    });

    try {
      await twitterClient.tweets.statusesUpdate({
        status: req.body.tweet
      }).then((response) => {
        res.json({
          status: 'Success',
          result: { id: response.id_str },
        });
      })  
    } catch (e) {
      console.warn(e);
      res.json({
        status: `Failure, ${e.toString()}`,
      });
    }
  }
};

export default postTweet;