import { useState } from 'react';
import app from 'state';

import ChainInfo from 'client/scripts/models/ChainInfo';
import { CommunityData } from 'client/scripts/views/pages/DirectoryPage/DirectoryPageContent';
import {
  getAvailableAddressesForStakeExchange,
  getInitialAccountValue,
} from '../utils';

interface UseStakeAddressesProps {
  community?: ChainInfo | CommunityData;
}

const useStakeAddresses = ({ community }: UseStakeAddressesProps = {}) => {
  const communityAddresses = (() => {
    if (community) {
      // get all the addresses of the user that matches base chain of selected `community`
      const userAddresses = app.user.addresses
        .filter(
          (addr) => addr.community.base === (community as ChainInfo)?.base,
        )
        .map((addr) => addr.address);

      // return all the unique addresses
      return [...new Set(userAddresses)];
    }

    return null;
  })();

  const activeAccountAddress =
    communityAddresses?.[0] || app?.user?.activeAccount?.address;

  const availableAddresses =
    communityAddresses?.length > 0
      ? communityAddresses.map((addr) => ({ address: addr }))
      : getAvailableAddressesForStakeExchange(
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
