import m from 'mithril';

const tokenListUrls = [
  "https://wispy-bird-88a7.uniswap.workers.dev/?url=http://tokenlist.aave.eth.link",
  "https://gateway.ipfs.io/ipns/tokens.uniswap.org",
  "https://wispy-bird-88a7.uniswap.workers.dev/?url=http://defi.cmc.eth.link"
]
export default async function getTokenLists() {
  if(localStorage.getItem("token-lists")) {
    return JSON.parse(localStorage.getItem("token-lists"))
  } else {
    var data : any = (await m.request({method: "GET", url: "https://gateway.ipfs.io/ipns/tokens.uniswap.org"}));
    var items = data.tokens;
    localStorage.setItem("token-lists",JSON.stringify(items))
    return items
  }
}