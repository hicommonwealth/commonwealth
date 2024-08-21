import { useState } from 'react';
import app from 'state';

import { ChainBase } from '@hicommonwealth/shared';
import { getUniqueUserAddresses } from 'helpers/user';
import useUserStore from 'state/ui/user';
import {
  getAvailableAddressesForStakeExchange,
  getInitialAccountValue,
} from '../utils';

interface UseStakeAddressesProps {
  stakedCommunityChainBase: ChainBase;
}

const useStakeAddresses = ({
  stakedCommunityChainBase,
}: UseStakeAddressesProps) => {
  const user = useUserStore();

  const communityAddresses = (() => {
    if (stakedCommunityChainBase) {
      // get all the addresses of the user that matches base chain of selected `community`
      const userAddresses = user.addresses
        .filter((addr) => addr.community.base === stakedCommunityChainBase)
        .map((addr) => addr.address);

      // return all the unique addresses
      return [...new Set(userAddresses)];
    }

    return null;
  })();

  const activeAccountAddress =
    communityAddresses?.[0] || user.activeAccount?.address || '';

  const availableAddresses = (() => {
    // if filtering addresses for a specific community

    if (communityAddresses?.length > 0) {
      return communityAddresses.map((addr) => ({ address: addr }));
    }

    // if user is a community member, we show active accounts connected to community
    if (user.activeAccount) {
      return getAvailableAddressesForStakeExchange(
        user.accounts,
        user.addresses,
      );
    }

    // if user is not a community member, we show addressess that match active chain base
    return getUniqueUserAddresses({ forChain: app?.chain?.base }).map(
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
