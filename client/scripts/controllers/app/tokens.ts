import m from 'mithril';
const DAY_IN_MILLISECONDS = 86400000;
const TOKEN_LISTS_LOCAL_STORAGE_KEY = "token-lists";
const TOKEN_LISTS_LAST_UPDATED_KEY = "token-lists-last-updated";

const tokenListUrls = [
  "https://wispy-bird-88a7.uniswap.workers.dev/?url=http://tokenlist.aave.eth.link",
  "https://gateway.ipfs.io/ipns/tokens.uniswap.org",
  "https://wispy-bird-88a7.uniswap.workers.dev/?url=http://defi.cmc.eth.link"
]
export default class TokensController {
   async getTokensFromLists() {
    if(localStorage.getItem(TOKEN_LISTS_LOCAL_STORAGE_KEY) ) {
      const lastUpdated = parseInt(localStorage.getItem(TOKEN_LISTS_LAST_UPDATED_KEY))
      const timeDiff = Date.now() - lastUpdated
      if (timeDiff < DAY_IN_MILLISECONDS) {
        return JSON.parse(localStorage.getItem(TOKEN_LISTS_LOCAL_STORAGE_KEY));
      }
    }
    var data : any = await Promise.all(
      tokenListUrls.map(url=>m.request({method: "GET", url }))
    );
    data = data.map(o=>o.tokens).flat();
    localStorage.setItem(TOKEN_LISTS_LOCAL_STORAGE_KEY,JSON.stringify(data));
    localStorage.setItem(TOKEN_LISTS_LAST_UPDATED_KEY,""+Date.now())
    return data;
  }
}