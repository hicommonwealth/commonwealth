export const BAN_CACHE_MOCK_FN = (chainId: string) => ({
  checkBan: async (options: any) => {
    if (options.chain === chainId && options.address === '0xbanned') {
      return [false, 'banned'];
    }
    return [true, null];
  },
});
