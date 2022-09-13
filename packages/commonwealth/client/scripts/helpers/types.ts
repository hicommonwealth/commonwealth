export enum Network {
    Mainnet = "Mainnet",
    Rinkeby = "Rinkeby",
    Ropsten = "Ropsten",
    Kovan = "Kovan",
    Goerli = "Goerli",
  }

export const networkIdToName = {
1: Network.Mainnet,
3: Network.Ropsten,
4: Network.Rinkeby,
5: Network.Goerli,
42: Network.Kovan,
};

export const networkNameToId = {
[Network.Mainnet]: 1,
[Network.Ropsten]: 3,
[Network.Rinkeby]: 4,
[Network.Goerli]: 5,
[Network.Kovan]: 42,
};