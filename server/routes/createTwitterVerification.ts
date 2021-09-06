import { recoverPersonalSignature } from 'eth-sig-util';
import { ethers } from 'ethers';
import { Octokit } from '@octokit/rest';
import { Request, Response, NextFunction } from 'express';
import { DB } from '../database';

const GITHUB_AUTHENTICATION = '';
const TWITTER_BEARER = '';

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
const USER_AGENT = 'Cloudflare Worker';

// format request for twitter api
const requestHeaders = new Headers();
requestHeaders.append('Authorization', `Bearer ${TWITTER_BEARER}`);
const requestOptions = {
  method: 'GET',
  headers: requestHeaders,
  redirect: 'follow',
};
const init = {
  headers: { 'content-type': 'application/json' },
};

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
    // get tweet id and account from url
    // const { searchParams } = new URL(request.url);
    // const tweetID = searchParams.get('id');
    // const account = searchParams.get('account');

    // get tweet data from twitter api
    const twitterURL = `https://api.twitter.com/2/tweets?ids=${tweetID}&expansions=author_id&user.fields=username`;
    requestOptions.headers.set('Origin', new URL(twitterURL).origin); // format for cors
    const twitterRes = await fetch(twitterURL, requestOptions);

    // parse the response from Twitter
    const twitterResponse = await gatherResponse(twitterRes);

    // if no tweet or author found, return error
    if (!twitterResponse.data || !twitterResponse.includes) {
      return {
        verified: false,
        error: 'Invalid tweet id',
      };
    }

    // get tweet text and handle
    const tweetContent = twitterResponse.data[0].text;
    const handle = twitterResponse.includes.users[0].username;

    // parse sig from tweet
    const matchedText = tweetContent.match(reg);

    // if no proper signature or handle data found, return error
    if (
      !twitterResponse.data
          || !twitterResponse.includes
          || !matchedText
    ) {
      return {
        verified: false,
        error: 'Invalid tweet format',
      };
    }

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
  const socialAccount = await models.SocialAccount.findOne({ where: {
    provider: 'twitter',
    provider_userid: req.user.id
  } });

  if (!socialAccount) {
    return next(new Error('No linked Twitter account'));
  }

  const result = await verifyTwitterIdentity(req.body.tweetID, req.body.address);

  if (result.verified) {
    return res.json({ status: 'Success' });
  }

  return next(new Error(result.error));
};

export default createTwitterVerification;
