export const getCommunityStakeSymbol = (chainNodeName: string = '') => {
  const sanitizedName = chainNodeName.toLowerCase().trim();
  if (sanitizedName.includes('base')) return 'BASE';
  if (sanitizedName.includes('blast')) return 'BLAST';
  return 'ETH';
};
