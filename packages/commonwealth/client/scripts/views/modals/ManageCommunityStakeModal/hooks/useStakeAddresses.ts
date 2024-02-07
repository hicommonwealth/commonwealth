import { useState } from 'react';
import app from 'state';

import {
  getAvailableAddressesForStakeExchange,
  getInitialAccountValue,
} from '../utils';

const useStakeAddresses = () => {
  const activeAccountAddress = app?.user?.activeAccount?.address;

  const availableAddresses = getAvailableAddressesForStakeExchange(
    app.user.activeAccounts,
    app.user.addresses,
  );

  const addressOptions = availableAddresses.map(({ address }) => ({
    label: address,
    value: address,
  }));

  const [selectedAddress, setSelectedAddress] = useState(
    getInitialAccountValue(activeAccountAddress, addressOptions),
  );

  return {
    selectedAddress,
    setSelectedAddress,
    addressOptions,
  };
};

export default useStakeAddresses;
