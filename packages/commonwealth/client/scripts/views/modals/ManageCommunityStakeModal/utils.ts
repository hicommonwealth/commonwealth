export const convertEthToUsd = (
  ethAmount: string | number,
  ethUsdRate: string,
) => {
  const eth =
    typeof ethAmount === 'number' ? Number(ethAmount) : parseFloat(ethAmount);
  const rate = parseFloat(ethUsdRate);

  if (isNaN(eth) || isNaN(rate)) {
    return '';
  }

  return (eth * rate).toFixed(2);
};

export const getInitialAccountValue = (
  activeAccountAddress: string,
  addressOptions: { value: string; label: string }[],
) => {
  return addressOptions.find(({ value }) => value === activeAccountAddress);
};

export const buildEtherscanLink = (txHash: string) => {
  // TODO remove goerli before production deployment
  const prefix = 'goerli.';
  return `https://${prefix}etherscan.io/tx/${txHash}`;
};
