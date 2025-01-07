import Web3 from 'web3';

export const calculateVoteWeight = (
  balance: string, // should be in wei
  voteWeight: number = 0,
  precision: number = 10 ** 18, // precision factor for multiplying
): bigint | null => {
  if (!balance || voteWeight <= 0) return null;
  // solution to multiply BigInt with fractional vote weight
  const scaledVoteWeight = BigInt(Math.round(voteWeight * precision));
  return (BigInt(balance) * scaledVoteWeight) / BigInt(precision);
};

export enum Denominations {
  'ETH' = 'ETH',
}

export const WeiDecimals: Record<Denominations, number> = {
  ETH: 18,
};

export const getAddressFromSignedMessage = (
  message: string,
  signature: string,
): string => {
  const web3 = new Web3();
  return web3.eth.accounts.recover(message, signature);
};
