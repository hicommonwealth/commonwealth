export default {
    Amount: 'i128',
    Keys: 'SessionKeys3',
    AmountOf: 'Amount',
    Balance: 'u128',
    CurrencyId: {
      _enum: ['CLV', 'CUSDT', 'DOT', 'CETH']
    },
    CurrencyIdOf: 'CurrencyId',
    CurrencyTypeEnum: {
      _enum: ['CLV', 'CUSDT', 'DOT', 'CETH']
    },
    PairKey: 'u64',
    Rate: 'FixedU128',
    Ratio: 'FixedU128',
    Price: 'FixedU128',
    Share: 'u128',
    OracleKey: 'CurrencyId',
    CurrencyInfo: {
      id: 'CurrencyId',
      name: 'CurrencyTypeEnum'
    },
    ExchangeInfo: {
      balance: 'Balance',
      routes: 'Vec<CurrencyTypeEnum>'
    },
    PoolId: {
      _enum: {
        Swap: 'u64'
      }
    },
    EcdsaSignature: '[u8; 65]',
    EvmAddress: 'H160',
}