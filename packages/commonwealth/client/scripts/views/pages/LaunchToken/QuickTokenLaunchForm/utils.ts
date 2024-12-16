export const generateCommunityNameFromToken = ({
  tokenName,
  tokenSymbol,
}: {
  tokenName: string;
  tokenSymbol: string;
}) => {
  return `${tokenName} (${tokenSymbol}) Community`;
};
