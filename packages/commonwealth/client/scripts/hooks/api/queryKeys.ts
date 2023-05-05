const queryKeys = {
  BULK_OFFCHAIN: (chainId) => `bulk-offchain-${chainId}`,
  TOPICS_FOR_CHAIN: (chainId) => `${chainId}-topics`,
};

export default queryKeys;
