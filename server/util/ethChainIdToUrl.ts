// TODO: replace with database query / something more flexible?
export default function (chainId: number): string {
  switch (chainId) {
    case 1: return 'https://eth-mainnet.alchemyapi.io/v2/cNC4XfxR7biwO2bfIO5aKcs9EMPxTQfr';
    case 3: return 'https://eth-ropsten.alchemyapi.io/v2/2xXT2xx5AvA3GFTev3j_nB9LzWdmxPk7';
    default: {
      throw new Error('Invalid chain id');
    }
  }
}
