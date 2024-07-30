import { userStore } from '../state/ui/user';

type GetUniqueUserAddressesArgs = {
  forChain?: string;
};

export const getUniqueUserAddresses = ({
  forChain,
}: GetUniqueUserAddressesArgs) => {
  const addresses = userStore.getState().addresses;

  const filteredAddresses = forChain
    ? addresses.filter((x) => x?.community?.base === forChain)
    : addresses;

  const addressStrings = filteredAddresses.map((x) => x.address);

  const uniqueAddresses = [...new Set(addressStrings)];

  return uniqueAddresses;
};
