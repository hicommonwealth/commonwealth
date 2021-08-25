export const HydraDXSpec = {
  types: {
    Fee: {
      numerator: 'u32',
      denominator: 'u32',
    },
    Chain: {
      genesisHash: 'Vec<u8>',
      lastBlockHash: 'Vec<u8>',
    },
    Price: 'Balance',
    Amount: 'i128',
    Address: 'AccountId',
    AmountOf: 'Amount',
    AssetPair: {
      asset_in: 'AssetId',
      asset_out: 'AssetId',
    },
    Intention: {
      who: 'AccountId',
      amount: 'Balance',
      discount: 'bool',
      asset_buy: 'AssetId',
      asset_sell: 'AssetId',
      sell_or_buy: 'IntentionType',
    },
    CurrencyId: 'AssetId',
    OrderedSet: 'Vec<AssetId>',
    BalanceInfo: {
      amount: 'Balance',
      assetId: 'AssetId',
    },
    IntentionId: 'Hash',
    CurrencyIdOf: 'AssetId',
    LookupSource: 'AccountId',
    IntentionType: {
      _enum: ['SELL', 'BUY'],
    },
    OrmlAccountData: {
      free: 'Balance',
      frozen: 'Balance',
      reserved: 'Balance',
    },
  },
};
