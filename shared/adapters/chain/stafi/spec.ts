export default {
  'RefCount': 'u32',
  'ChainId': 'u8',
  'ResourceId': '[u8; 32]',
  'DepositNonce': 'u64',
  'RateType': 'u64',
  'AccountRData': {
    'free': 'u128'
  },
  'RSymbol': {
    '_enum': [
      'RFIS'
    ]
  },
  'ProposalStatus': {
    '_enum': [
      'Active',
      'Passed',
      'Expired',
      'Executed'
    ]
  },
  'ProposalVotes': {
    'voted': 'Vec<AccountId>',
    'status': 'ProposalStatus',
    'expiry': 'BlockNumber'
  }
};
