import TokenListCache from '../util/tokenListCache';

const addDecimalsToTokens = async (models) => {
  const tlc = new TokenListCache();
  const tokens = await tlc.getTokens();

  const chains = await models.Chain.findAll();
  let rowsChanged = 0;
  await Promise.all(chains.map(async (chain) => {
    if (chain.type === 'token'
    && (chain.decimals === undefined || chain.decimals === null)) {
      const token = tokens.find((o) => o.name === chain.name && o.symbol === chain.symbol);
      if (token) {
        chain.decimals = token.decimals;
        await chain.save();
        rowsChanged++;
      }
    }
  }));
  return rowsChanged;
};

export default addDecimalsToTokens;
