import app from 'state';

export const POLOGON_CHAIN_OPTION = {
  label: 'Polygon',
  value: 'polygon',
};

export const existingCommunityNames = app.config.chains
  .getAll()
  .map((community) => community.name.toLowerCase().trim());
