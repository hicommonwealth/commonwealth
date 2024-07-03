import { useState } from 'react';
import app from 'state';

import { getUniqueUserAddresses } from 'client/scripts/helpers/user';
import ChainInfo from 'client/scripts/models/ChainInfo';
import useUserStore from 'client/scripts/state/ui/user';
import { CommunityData } from 'client/scripts/views/pages/DirectoryPage/DirectoryPageContent';
import {
  getAvailableAddressesForStakeExchange,
  getInitialAccountValue,
} from '../utils';

interface UseStakeAddressesProps {
  community?: ChainInfo | CommunityData;
}

const useStakeAddresses = ({ community }: UseStakeAddressesProps = {}) => {
  const user = useUserStore();

  const communityAddresses = (() => {
    if (community) {
      // get all the addresses of the user that matches base chain of selected `community`
      const userAddresses = user.addresses
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
    communityAddresses?.[0] || user.activeAccount?.address || '';

  const availableAddresses = (() => {
    // if filtering addresses for a specific community
    // @ts-expect-error StrictNullChecks
    if (communityAddresses?.length > 0) {
      // @ts-expect-error StrictNullChecks
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
