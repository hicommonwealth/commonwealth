import { useState } from 'react';
import app from 'state';

import {
  getAvailableAddressesForStakeExchange,
  getInitialAccountValue,
  getUniqueUserAddressesForChainBase,
} from '../utils';

const useStakeAddresses = () => {
  const activeAccountAddress = app?.user?.activeAccount?.address;

  const availableAddresses = (() => {
    // if user is a community member, we show active accounts connected to community
    if (app?.user?.activeAccount) {
      return getAvailableAddressesForStakeExchange(
        app.user.activeAccounts,
        app.user.addresses,
      );
    }

    // if user is not a community member, we show addressess that match active chain base
    return getUniqueUserAddressesForChainBase(app?.chain?.base).map(
      (address) => ({ address }),
    );
  })();

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
