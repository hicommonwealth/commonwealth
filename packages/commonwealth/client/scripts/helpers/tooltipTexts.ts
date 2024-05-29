import { ChainBase } from '@hicommonwealth/shared';

type StakeButtonToolTipHelperProps = {
  isLoggedIn?: boolean;
  connectBaseChainToBuy?: ChainBase;
};

export const disabledStakeButtonTooltipText = ({
  isLoggedIn = true,
  connectBaseChainToBuy,
}: StakeButtonToolTipHelperProps) => {
  if (!isLoggedIn) return 'Login to buy stakes';
  if (connectBaseChainToBuy) {
    return `Connect an ${connectBaseChainToBuy} based wallet or join this community to buy stake`;
  }
  return '';
};
