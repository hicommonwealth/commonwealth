import app from 'state';

export const POLOGON_CHAIN_OPTION = {
  label: 'Polygon',
  value: 'polygon',
};

export const existingCommunityNames = app.config.chains
  .getAll()
  .map((community) => community.name.toLowerCase().trim());

// Get chain id's from the app.config.chains for all eth and cosmos chains
export const chainTypes = app.config.nodes
  .getAll()
  .filter(
    (chain) =>
      chain.ethChainId || chain.cosmosChainId || chain.balanceType === 'solana',
  )
  .map((chain) => ({
    chainBase: chain.ethChainId
      ? 'ethereum'
      : chain.cosmosChainId
      ? 'cosmos'
      : 'solana',
    value: chain.ethChainId || chain.cosmosChainId || 'solana',
    label: chain.name.replace(/\b\w/g, (l) => l.toUpperCase()),
  }));
