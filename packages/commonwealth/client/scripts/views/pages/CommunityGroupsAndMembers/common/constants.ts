import app from 'state';

export const TOKENS = {
  COSMOS_TOKEN: 'cosmos_native',
  EVM_TOKEN: 'eth_native',
};

export const SPL_SPECIFICATION = 'spl';

export const ERC_SPECIFICATIONS = {
  ERC_20: 'erc20',
  ERC_721: 'erc721',
  ERC_1155: 'erc1155',
};

export const CW_SPECIFICATIONS = {
  CW_721: 'cw721',
  CW_20: 'cw20',
};

export const BLOCKCHAINS = {
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
  { value: CW_SPECIFICATIONS.CW_20, label: 'CW-20' },
  { value: CW_SPECIFICATIONS.CW_721, label: 'CW-721' },
  { value: ERC_SPECIFICATIONS.ERC_20, label: 'ERC-20' },
  { value: ERC_SPECIFICATIONS.ERC_721, label: 'ERC-721' },
  { value: ERC_SPECIFICATIONS.ERC_1155, label: 'ERC-1155' },
  { value: TOKENS.EVM_TOKEN, label: 'EVM base tokens' },
  { value: SPL_SPECIFICATION, label: 'Solana SPL Token' },
];

export const conditionTypes = [
  { value: AMOUNT_CONDITIONS.MORE, label: 'More than' },
  { value: AMOUNT_CONDITIONS.EQUAL, label: 'Equal to' },
  { value: AMOUNT_CONDITIONS.LESS, label: 'Less than' },
];

// Get chain id's from the app.config.chains for all eth and cosmos chains
export const chainTypes = app.config.nodes
  .getAll()
  .filter((chain) => chain.ethChainId || chain.cosmosChainId)
  .map((chain) => ({
    chainBase: chain.ethChainId ? 'ethereum' : 'cosmos',
    value: chain.ethChainId || chain.cosmosChainId,
    label: chain.name.replace(/\b\w/g, (l) => l.toUpperCase()),
  }));
