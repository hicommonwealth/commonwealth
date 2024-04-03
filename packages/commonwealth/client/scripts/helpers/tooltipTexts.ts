import { ChainBase } from '@hicommonwealth/core';

export const disabledStakeButtonTooltipText = ({
  isLoggedIn = true,
  connectBaseChainToBuy,
}: {
  isLoggedIn?: boolean;
  connectBaseChainToBuy?: ChainBase;
}) => {
  if (!isLoggedIn) return 'Login to buy stakes';
  if (connectBaseChainToBuy) {
    return `Connect an ${connectBaseChainToBuy} based wallet or join this community to buy stake`;
  }
  return '';
};
