import { ValidChains } from '@hicommonwealth/evm-protocols';
import { IconName } from 'views/components/component_kit/cw_icons/cw_icon_lookup';

export const networkChainOptions = [
  {
    label: 'Ethereum Base',
    value: ValidChains.Base,
    icon: 'base' as IconName,
  },
  {
    label: 'Ethereum Mainnet',
    value: ValidChains.Mainnet,
    icon: 'ethereum' as IconName,
  },
] as const;
