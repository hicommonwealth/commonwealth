import fetch from 'node-fetch';
import _ from 'underscore';

import { TokenResponse } from '../../shared/types';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

const TWENTY_FOUR_HOURS = 86400000;

class TokenListCache {
  private _lastTimeHit = 0;
  private _cachedData: TokenResponse[] = [];

  constructor(
    private readonly _cachingPeriodS = TWENTY_FOUR_HOURS,
    private readonly _tokenListUrls = [
      // 'https://tokens.coingecko.com/uniswap/all.json',
      'https://gateway.ipfs.io/ipns/tokens.uniswap.org',
      // 'https://raw.githubusercontent.com/jab416171/uniswap-pairtokens/master/uniswap_pair_tokens.json',
      // 'https://app.tryroll.com/tokens.json',
    ],
  ) {

  }

  public async getTokens(): Promise<TokenResponse[]> {
    if (this._cachedData && (Date.now() - this._lastTimeHit) < this._cachingPeriodS) {
      return this._cachedData;
    }

    const responseData = await Promise.all(
      this._tokenListUrls.map(async (url) => {
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

    let tokens: TokenResponse[] = _.flatten(responseData.map((d) => d.tokens));
    if (process.env.NODE_ENV === 'development') {
      // Test token
      tokens = tokens.concat({
        'chainId': 1,
        'address': '0x1000000000000000000000000000000000000000',
        'name': 'Test token',
        'symbol': 'ABC',
        'decimals': 18,
        'logoURI': 'https://assets.coingecko.com/coins/images/13397/thumb/Graph_Token.png?1608145566'
      });
    }

    this._cachedData = tokens;
    this._lastTimeHit = Date.now();
    return tokens;
  }
}

export default TokenListCache;
