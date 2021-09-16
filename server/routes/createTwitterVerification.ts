import { recoverPersonalSignature } from 'eth-sig-util';
import { ethers } from 'ethers';
import { Octokit } from '@octokit/rest';
import { Request, Response, NextFunction } from 'express';
import { DB } from '../database';
import axios from 'axios';

const GITHUB_AUTHENTICATION = process.env.GITHUB_CLIENT_SECRET;
const TWITTER_BEARER = process.env.TWITTER_BEARER;

export async function gatherResponse(response) {
  const { headers } = response;
  const contentType = headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  } else if (contentType.includes('application/text')) {
    return response.text();
  } else if (contentType.includes('text/html')) {
    return response.text();
  } else {
    return response.text();
  }
}

// github api info
const USER_AGENT = 'Commonwealth Worker';

// regex for parsing tweet
const reg = new RegExp('(?<=sig:).*');

/**
 * @param {*} request
 * Accpets id=<tweet id>
 * Accepts account=<eth address> // just used to aler client of incorrect signer found
 *
 * 1. fetch tweet data using tweet id
 * 2. construct signature data using handle from tweet
 * 3. recover signer of signature from tweet
 * 4. if signer is the expected address, update gist with address -> handle mapping
 */
async function verifyTwitterIdentity(tweetID, account) {
  try {

    // get tweet data from twitter api
    // eslint-disable-next-line max-len
    const twitterURL = `https://api.twitter.com/2/tweets?ids=${tweetID}&expansions=author_id&user.fields=username`;

    const requestHeaders = {
      'Authorization': `Bearer ${TWITTER_BEARER}`,
    };
    
    let twitterRes
    try {
      const { data: twitterResponse } = await axios(twitterURL, { method:'GET', headers:requestHeaders });
      twitterRes = twitterResponse;
    } catch (e) {
      console.warn(e.response);
    }

    // parse the response from Twitter
    if (!twitterRes.data || !twitterRes.includes) {
      return {
        verified: false,
        error: 'Invalid tweet id',
      };
    }
    // if no tweet or author found, return error

    // get tweet text and handle
    const tweetContent = twitterRes.data[0].text;
    const handle = twitterRes.includes.users[0].username;

    // parse sig from tweet
    const matchedText = tweetContent.match(reg);

    // if no proper signature or handle data found, return error
    if (
      !twitterRes.data
          || !twitterRes.includes
          || !matchedText
    ) {
      return {
        verified: false,
        error: 'Invalid tweet format',
      };
    }

    /* Swap this whole thing out with Address.verify so this can be cross chain */
    // construct data for EIP712 signature recovery
    const data = {
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
        ],
        Permit: [{ name: 'username', type: 'string' }],
      },
      domain: {
        name: 'Sybil Verifier',
        version: '1',
      },
      primaryType: 'Permit',
      message: {
        username: handle,
      },
    };

    // parse sig from tweet
    const sig = matchedText[0].slice(0, 132);

    // recover signer
    const signer = recoverPersonalSignature({
      data: JSON.stringify(data),
      sig,
    });

    // format with chekcsummed address
    const formattedSigner = ethers.utils.getAddress(signer);

    // if signer found is not the expected signer, alert client and dont update gist
    if (account !== formattedSigner) {
      return {
        verified: false,
        error: 'Invalid account'
      };
    }

    // Don't use this until we actually have Sybil push access (reach out to Github)
    const pushToSybil = async () => {
      const fileName = 'verified.json';
      const githubPath = '/repos/Uniswap/sybil-list/contents/';
  
      const fileInfo = await fetch(
        `https://api.github.com${githubPath}${fileName}`,
        {
          headers: {
            Authorization: `token ${GITHUB_AUTHENTICATION}`,
            'User-Agent': USER_AGENT,
          },
        }
      );
      const fileJSON = await fileInfo.json();
      const sha = fileJSON.sha;
  
      // Decode the String as json object
      const decodedSybilList = JSON.parse(atob(fileJSON.content));
      decodedSybilList[formattedSigner] = {
        twitter: {
          timestamp: Date.now(),
          tweetID,
          handle,
        },
      };
  
      const stringData = JSON.stringify(decodedSybilList);
      const encodedData = btoa(stringData);
  
      const octokit = new Octokit({
        auth: GITHUB_AUTHENTICATION,
      });
  
      const updateResponse = await octokit.request(
        `PUT ${githubPath}${fileName}`,
        {
          owner: 'uniswap',
          repo: 'sybil-list',
          path: fileName,
          message: `Linking ${formattedSigner} to handle: ${handle}`,
          sha,
          content: encodedData,
        }
      );
  
      if (updateResponse.status === 200) {
        return {
          verified: true,
        };
      }
      return {
        verified: false,
        error: 'Error updating list'
      };
    }

    return {
      verified: true,
    };
  } catch (e) {
    return {
      verified: false,
      error: e
    };
  }
}

const createTwitterVerification = async (models: DB, req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new Error('Not logged in'));
  }
  if (!req.body.tweetID) {
    return res.status(400).json({ error: 'No tweetID provided' });
  }
  if (!req.body.address) {
    return res.status(400).json({ error: 'No address provided' });
  }
  /* need to update all addresses to twitter verifications */ 
  const socialAccount = await models.SocialAccount.findOne({ where: {
    provider: 'twitter',
    provider_username: req.body.twitter_username,
  } });

  if (!socialAccount) {
    return next(new Error('No linked Twitter account'));
  }

  const result = await verifyTwitterIdentity(req.body.tweetID, req.body.address);

  if (result.verified) {
    const addressesToUpdate = await models.Address.findOne({ where: {
      address: req.body.address,
      user_id: req.user.id,
      chain: req.body.chain,
    } });
    await addressesToUpdate.update({ twitter_verified: true });
    return res.json({ status: 'Success' });
  }

  return next(new Error(result.error));
};

export default createTwitterVerification;
