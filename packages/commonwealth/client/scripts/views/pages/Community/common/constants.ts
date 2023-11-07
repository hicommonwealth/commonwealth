import app from 'state';

export const TOKENS = {
  COSMOS_TOKEN: 'cosmos_native',
  EVM_TOKEN: 'eth_native',
};

export const SPECIFICATIONS = {
  ERC_20: 'erc20',
  ERC_721: 'erc721',
};

export const BLOCKCHAINS = {
  AXIE_INFINITY: 'axie-infinity',
  COSMOS: 'cosmos',
  ETHEREUM: 'ethereum',
  INJECTIVE: 'injective',
  POLYGON: 'polygon',
};

export const AMOUNT_CONDITIONS = {
  MORE: 'more',
  EQUAL: 'equal',
  LESS: 'less',
};

export const requirementTypes = [
  { value: TOKENS.COSMOS_TOKEN, label: 'Cosmos base tokens' },
  { value: SPECIFICATIONS.ERC_20, label: 'ERC-20' },
  { value: SPECIFICATIONS.ERC_721, label: 'ERC-721' },
  { value: TOKENS.EVM_TOKEN, label: 'EVM base tokens' },
];

export const conditionTypes = [
  { value: AMOUNT_CONDITIONS.MORE, label: 'More than' },
  { value: AMOUNT_CONDITIONS.EQUAL, label: 'Equal to' },
  { value: AMOUNT_CONDITIONS.LESS, label: 'Less than' },
];

// Get chain id's from the app.config.chains for all eth and cosmos chains
const ethAndCosmosChains = app.config.chains
  .getAll()
  .filter((x) =>
    x.base === 'ethereum'
      ? x?.ChainNode?.ethChainId
      : x.base === 'cosmos'
      ? true
      : false,
  );
export const chainTypes = ethAndCosmosChains.map((chain) => ({
  chainBase: chain.base,
  value: chain.base === 'cosmos' ? 'cosmos' : chain?.ChainNode?.ethChainId,
  label: chain.name.replace(/\b\w/g, (l) => l.toUpperCase()),
}));
