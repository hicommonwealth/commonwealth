
import { Request, Response, NextFunction } from 'express';
import fetch from 'node-fetch';
const tokenListUrls = [
  "https://wispy-bird-88a7.uniswap.workers.dev/?url=http://tokenlist.aave.eth.link",
  "https://gateway.ipfs.io/ipns/tokens.uniswap.org",
  "https://wispy-bird-88a7.uniswap.workers.dev/?url=http://defi.cmc.eth.link"
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
  const data = responseData.map((o)=>o.success ? o.data.tokens : []).flat();
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