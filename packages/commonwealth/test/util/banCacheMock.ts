export const BAN_CACHE_MOCK_FN = (communityId: string) => ({
  checkBan: async (options: any) => {
    if (options.communityId === communityId && options.address === '0xbanned') {
      return [false, 'banned'];
    }
    return [true, null];
  },
});
