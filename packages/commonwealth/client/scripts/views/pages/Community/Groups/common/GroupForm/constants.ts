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
  NEAR: 'near',
  POLKADOT: 'polkadot',
  POLYGON: 'polygon',
  SOLANA: 'solana',
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

// Get eth chain id from the app.config.chains for these chains
const chainIdsToFind = [
  'axie-infinity',
  'cosmos',
  'ethereum',
  'injective',
  'near',
  'polkadot',
  'polygon',
  'solana',
];
const foundChains = app.config.chains
  .getAll()
  .filter((x) => chainIdsToFind.includes(x.id.toLowerCase()));
export const chainTypes = chainIdsToFind.map((x, index) => ({
  value:
    foundChains.find((y) => y.id.toLowerCase() === x)?.ChainNode?.ethChainId ||
    index - 999, // TODO: some chains don't have an ethChainId
  label: x.replace(/\b\w/g, (l) => l.toUpperCase()),
}));

export const conditionTypes = [
  { value: AMOUNT_CONDITIONS.MORE, label: 'More than' },
  { value: AMOUNT_CONDITIONS.EQUAL, label: 'Equal to' },
  { value: AMOUNT_CONDITIONS.LESS, label: 'Less than' },
];
