import React from 'react';
import { CWCustomIcon } from 'views/components/component_kit/cw_icons/cw_custom_icon';

export const findDenominationIcon = (denomination: string) => {
  if (!denomination) return;
  return {
    BLAST: <CWCustomIcon iconName="blast" iconSize="xs" />,
    ETH: <CWCustomIcon iconName="eth" iconSize="xs" />,
    BASE: <CWCustomIcon iconName="base" iconSize="xs" />,
  }[denomination];
};

export const findDenominationString = (selectedStakeChain: string) => {
  if (!selectedStakeChain) return;
  return {
    Ethereum: selectedStakeChain.toLowerCase().includes('ethereum') && 'ETH',
    Base: selectedStakeChain.toLowerCase().includes('base') && 'BASE',
    Blast: selectedStakeChain.toLowerCase().includes('blast') && 'BLAST',
  }[selectedStakeChain];
};
