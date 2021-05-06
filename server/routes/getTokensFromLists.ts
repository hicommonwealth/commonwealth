
import { Request, Response, NextFunction } from 'express';
import fetch from 'node-fetch';
const tokenListUrls = [
  "https://tokens.coingecko.com/uniswap/all.json",
  "https://gateway.ipfs.io/ipns/tokens.uniswap.org",
  "https://raw.githubusercontent.com/jab416171/uniswap-pairtokens/master/uniswap_pair_tokens.json",
  "https://app.tryroll.com/tokens.json",
]

const TWENTY_FOUR_HOURS = 86400000;

let lastTimeHit = 0;
let cachedData = null;
export const getTokensFromListsInternal = async () => {
  if(cachedData && Date.now() - lastTimeHit < TWENTY_FOUR_HOURS) {
    return cachedData;
  }
  const responseData : any = await Promise.all(
    tokenListUrls.map(url=>fetch( url )
      .then((response) => response.json())
      .then((response) => { return { success: true, data: response }})
      .catch( _ => { return { success: false } }))
  );
  let data = responseData.map((o)=>o.success ? o.data.tokens : []).flat();
  if(process.env.NODE_ENV === 'development') {
    // Test token
    data = data.concat({
      "chainId": 1,
      "address": "0x1000000000000000000000000000000000000000",
      "name": "Test token",
      "symbol": "ABC",
      "decimals": 18,
      "logoURI": "https://assets.coingecko.com/coins/images/13397/thumb/Graph_Token.png?1608145566"
    })  
  }
  cachedData = data;
  lastTimeHit = Date.now();
  return data;
}

export const getTokensFromLists = async (models, req: Request, res: Response, next: NextFunction) => {
  try {
    const tokens = await getTokensFromListsInternal();
    return res.json({ status: 'Success', result: tokens });
  } catch (e) {
    return res.json({ status: 'Failure', message: e.message });
  }
};