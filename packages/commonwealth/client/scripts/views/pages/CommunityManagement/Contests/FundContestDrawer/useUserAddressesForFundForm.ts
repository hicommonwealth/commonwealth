import useUserActiveAccount from 'hooks/useUserActiveAccount';
import { useEffect, useMemo, useState } from 'react';
import app from 'state';

const useUserAddressesForFundForm = () => {
  const { activeAccount } = useUserActiveAccount();

  const addressOptions = app?.user?.activeAccounts?.map((account) => ({
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
