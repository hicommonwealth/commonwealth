import { ValidChains } from '@hicommonwealth/evm-protocols';
import { useState } from 'react';
import { IconName } from 'views/components/component_kit/cw_icons/cw_icon_lookup';
import { networkChainOptions } from './options';
import { useNetworkSelectorProps } from './types';

const useNetworkSelector = ({ initialNetwork }: useNetworkSelectorProps) => {
  const [selectedNetwork, setSelectedNetwork] = useState<{
    label: string;
    value: ValidChains;
    icon: IconName;
  }>(initialNetwork ? initialNetwork : networkChainOptions[0]);

  return {
    selectedNetwork,
    setSelectedNetwork,
  };
};

export default useNetworkSelector;
