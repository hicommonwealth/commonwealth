import { ChainBase } from '@hicommonwealth/shared';
import { getUniqueUserAddresses } from 'client/scripts/helpers/user';
import { useState } from 'react';

const useAddressSelector = () => {
  const uniqueAddresses =
    getUniqueUserAddresses({
      forChain: ChainBase.Ethereum,
    }) || [];

  const [selectedAddress, setSelectedAddress] = useState<string>(
    uniqueAddresses?.[0] || '',
  );

  return {
    selectedAddress,
    setSelectedAddress,
    uniqueAddresses,
  };
};

export default useAddressSelector;
