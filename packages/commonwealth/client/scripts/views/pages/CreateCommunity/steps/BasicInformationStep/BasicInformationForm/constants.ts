import App from 'state';

export const POLOGON_CHAIN_OPTION = {
  label: 'Polygon',
  value: 'polygon',
};

export const existingCommunityNames = App.config.chains
  .getAll()
  .map((community) => community.name.toLowerCase().trim());
