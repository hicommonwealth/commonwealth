import { useState } from 'react';
import app from 'state';

import ChainInfo from 'client/scripts/models/ChainInfo';
import { CommunityData } from 'client/scripts/views/pages/DirectoryPage/DirectoryPageContent';
import {
  getAvailableAddressesForStakeExchange,
  getInitialAccountValue,
} from '../utils';

interface useStakeAddressesProps {
  community?: ChainInfo | CommunityData;
}

const useStakeAddresses = (props: useStakeAddressesProps = {}) => {
  const { community } = props;

  let communityAddressInfo;

  if (community) {
    communityAddressInfo = app.user.addresses.find(
      (addr) => addr.community.id === community.id,
    );
  }

  const activeAccountAddress =
    communityAddressInfo?.address || app?.user?.activeAccount?.address;

  const availableAddresses = communityAddressInfo
    ? [communityAddressInfo]
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
