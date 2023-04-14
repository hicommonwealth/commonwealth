import { factory, formatFilename } from 'common-common/src/logging';
import fetch from 'node-fetch';
import _ from 'underscore';
import type { TokenResponse } from '../../shared/types';
import { slugify } from '../../shared/utils';
import type { TokenAttributes } from '../models/token';
import type { DB } from '../models';

const log = factory.getLogger(formatFilename(__filename));

async function addTokenListsToDatabase(models: DB): Promise<void> {
  const _tokenListUrls = [
    'https://app.tryroll.com/tokens.json',
    'https://tokens.coingecko.com/uniswap/all.json',
    'https://gateway.ipfs.io/ipns/tokens.uniswap.org',
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

  for (const token of tokens) {
    const where: TokenAttributes = {
      id: slugify(token.name),
      name: token.name,
      address: token.address,
      symbol: token.symbol,
      decimals: token.decimals,
      chain_id: token.chainId,
    };
    if (token.logoURI) {
      where.icon_url = token.logoURI;
    }
    try {
      await models.Token.findOrCreate({ where });
    } catch (e) {
      log.info(`Could not add ${token.name}: ${e.message}`);
      log.info(JSON.stringify(where, null, 2));
    }
  }
}

export default addTokenListsToDatabase;
