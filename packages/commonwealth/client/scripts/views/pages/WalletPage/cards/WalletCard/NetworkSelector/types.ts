import { ValidChains } from '@hicommonwealth/evm-protocols';
import { IconName } from 'views/components/component_kit/cw_icons/cw_icon_lookup';

export type SelectedNetwork = {
  label: string;
  value: ValidChains;
  icon: IconName;
};

export type NetworkSelectorProps = {
  network: SelectedNetwork;
  onNetworkSelected: (network: SelectedNetwork) => void;
};

export type useNetworkSelectorProps = {
  initialNetwork?: SelectedNetwork;
};
