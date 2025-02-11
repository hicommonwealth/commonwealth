import { uniqBy } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import useUserStore from 'state/ui/user';

const useUserAddressesForFundForm = () => {
  const user = useUserStore();

  const filteredAddresses = useMemo(() => {
    const filtered = user.addresses.filter(
      (address) => address.community?.base === user.activeCommunity?.base,
    );

    return uniqBy(filtered, 'address');
  }, [user.addresses, user.activeCommunity?.base]);

  const addressOptions = filteredAddresses.map((address) => ({
    value: String(address.address),
    label: address.address,
  }));

  const activeAddressOption = useMemo(() => {
    const activeAddress = filteredAddresses[0];
    return {
      value: activeAddress?.address || '',
      label: activeAddress?.address || '',
    };
  }, [filteredAddresses]);

  const [selectedAddress, setSelectedAddress] = useState(activeAddressOption);

  // this is needed because drawer is not unmounted on close
  useEffect(() => {
    setSelectedAddress(activeAddressOption);
  }, [activeAddressOption]);

  return {
    addressOptions,
    selectedAddress,
    setSelectedAddress,
  };
};

export default useUserAddressesForFundForm;
