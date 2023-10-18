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

export const chainTypes = [
  { value: BLOCKCHAINS.AXIE_INFINITY, label: 'Axie Infinity' },
  { value: BLOCKCHAINS.COSMOS, label: 'Cosmos' },
  { value: BLOCKCHAINS.ETHEREUM, label: 'Ethereum' },
  { value: BLOCKCHAINS.INJECTIVE, label: 'Injective' },
  { value: BLOCKCHAINS.NEAR, label: 'NEAR' },
  { value: BLOCKCHAINS.POLKADOT, label: 'Polkadot' },
  { value: BLOCKCHAINS.POLYGON, label: 'Polygon' },
  { value: BLOCKCHAINS.SOLANA, label: 'Solana' },
];

export const conditionTypes = [
  { value: AMOUNT_CONDITIONS.MORE, label: 'More than' },
  { value: AMOUNT_CONDITIONS.EQUAL, label: 'Equal to' },
  { value: AMOUNT_CONDITIONS.LESS, label: 'Less than' },
];
