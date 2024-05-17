export const formatAddressCompact = (address: string, size = 6) => {
  return `${address.substring(0, size)}...${address.substring(
    address.length - size,
    address.length,
  )}`;
};
