export default {
  AssetPair: {
    asset_in: 'AssetId',
    asset_out: 'AssetId',
  },
  Amount: 'i128',
  AmountOf: 'Amount',
  Address: 'AccountId',
  OrmlAccountData: {
    free: 'Balance',
    frozen: 'Balance',
    reserved: 'Balance',
  },
  BalanceInfo: {
    amount: 'Balance',
    assetId: 'AssetId',
  },
  Chain: {
    genesisHash: 'Vec<u8>',
    lastBlockHash: 'Vec<u8>',
  },
  CurrencyId: 'AssetId',
  CurrencyIdOf: 'AssetId',
  Intention: {
    who: 'AccountId',
    asset_sell: 'AssetId',
    asset_buy: 'AssetId',
    amount: 'Balance',
    discount: 'bool',
    sell_or_buy: 'IntentionType',
  },
  IntentionId: 'Hash',
  IntentionType: {
    _enum: ['SELL', 'BUY'],
  },
  LookupSource: 'AccountId',
  OrderedSet: 'Vec<AssetId>',
  Price: 'Balance',
  Fee: {
    numerator: 'u32',
    denominator: 'u32',
  },
};
