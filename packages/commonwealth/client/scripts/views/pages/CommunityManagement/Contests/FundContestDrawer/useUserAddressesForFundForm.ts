import useUserStore from 'client/scripts/state/ui/user';
import { useEffect, useMemo, useState } from 'react';

const useUserAddressesForFundForm = () => {
  const user = useUserStore();
  const activeAccount = user.activeAccount;

  const addressOptions = user.accounts.map((account) => ({
    value: String(account.address),
    label: account.address,
  }));

  const activeAccountOption = useMemo(
    () => ({
      value: String(activeAccount?.address),
      label: activeAccount?.address || '',
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
