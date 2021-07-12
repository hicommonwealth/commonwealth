import fetch from 'node-fetch';
import _ from 'underscore';
import { slugify } from '../../shared/utils';

import { TokenResponse } from '../../shared/types';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));


async function addTokenListsToDatabase(models) {
  const _tokenListUrls = [
    'https://tokens.coingecko.com/uniswap/all.json',
    'https://gateway.ipfs.io/ipns/tokens.uniswap.org',
    'https://raw.githubusercontent.com/jab416171/uniswap-pairtokens/master/uniswap_pair_tokens.json',
    'https://app.tryroll.com/tokens.json',
  ];

  const responseData = await Promise.all(
    _tokenListUrls.map(async (url) => {
      try {
        const response = await fetch(url);
        const responseJson: { tokens: TokenResponse[] } = await response.json();
        return responseJson;
      } catch (err) {
        log.error(`Failed to fetch from token list ${url}: ${err.message}`);
        return { tokens: [] };
      }
    })
  );

  const tokens: TokenResponse[] = _.flatten(responseData.map((d) => d.tokens));

  return Promise.all(tokens.map(async (token) => {
    return models.Token.findOrCreate({
      where: {
        id: slugify(token.name),
        name: token.name,
        address: token.address,
        symbol: token.symbol,
        decimals: token.decimals
      }
    }).catch((e) => {
      log.info(`Could not add ${token.name}: ${e.message}`);
      throw e;
    });
  }))
    .then(() => { return 1; /* success */ })
    .catch(() => { return 0; /* failure */ });
}


export default addTokenListsToDatabase;
