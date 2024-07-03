import useUserStore from 'client/scripts/state/ui/user';
import useUserActiveAccount from 'hooks/useUserActiveAccount';
import { useEffect, useMemo, useState } from 'react';
import app from 'state';

const useUserAddressesForFundForm = () => {
  const { activeAccount } = useUserActiveAccount();
  const user = useUserStore();

  const addressOptions = user.accounts.map((account) => ({
    value: String(account.address),
    label: account.address,
  }));

  const activeAccountOption = useMemo(
    () => ({
      value: String(activeAccount?.address),
      label: activeAccount?.address,
    }),
    [activeAccount?.address],
  );

  const [selectedAddress, setSelectedAddress] = useState(activeAccountOption);

  // this is needed because drawer is not unmounted on close
  useEffect(() => {
    setSelectedAddress(activeAccountOption);
  }, [activeAccountOption]);

  return {
    addressOptions,
    selectedAddress,
    setSelectedAddress,
  };
};

export default useUserAddressesForFundForm;
