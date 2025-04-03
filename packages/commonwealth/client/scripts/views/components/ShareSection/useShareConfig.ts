import { formatAddressShort } from 'helpers';
import { uniqBy } from 'lodash';
import { useMemo, useState } from 'react';
import app from 'state';
import useUserStore from 'state/ui/user';

export function useShareConfig() {
  const user = useUserStore();
  const hasJoinedCommunity = !!user.activeAccount;
  const communityId = hasJoinedCommunity ? app.activeChainId() : '';

  const availableAddresses = uniqBy(user.addresses, 'address');

  const addressOptions = availableAddresses.map((addressInfo) => ({
    value: addressInfo.address,
    label: formatAddressShort(addressInfo.address, 6),
  }));

  const refAddress = communityId
    ? user.activeAccount?.address
    : addressOptions?.[0]?.value;

  const [refCode, setRefCode] = useState(refAddress);

  return useMemo(() => {
    return {
      communityId,
      refCode,
      setRefCode,
    };
  }, [communityId, refCode]);
}
