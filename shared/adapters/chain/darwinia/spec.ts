export default {
  'UsableBalance': {
    'usableBalance': 'Balance'
  },
  'Status': {
    '_enum': {
      'Free': null,
      'Reserved': null
    }
  },
  'Address': 'AccountId',
  'LookupSource': 'AccountId',
  'BalanceInfo': {},
  'BalanceLock': {
    'id': 'LockIdentifier',
    'lockFor': 'LockFor',
    'reasons': 'Reasons'
  },
  'LockFor': {
    '_enum': {
      'Common': 'Common',
      'Staking': 'StakingLock'
    }
  },
  'Common': {
    'amount': 'Balance'
  },
  'StakingLock': {
    'stakingAmount': 'Balance',
    'unbondings': 'Vec<Unbonding>'
  },
  'Reasons': {
    '_enum': [
      'Fee',
      'Misc',
      'All'
    ]
  },
  'Unbonding': {
    'amount': 'Balance',
    'moment': 'BlockNumber'
  },
  'AccountData': {
    'free': 'Balance',
    'reserved': 'Balance',
    'freeKton': 'Balance',
    'reservedKton': 'Balance',
    'miscFrozen': 'Balance',
    'feeFrozen': 'Balance'
  },
  'RingBalance': 'Balance',
  'KtonBalance': 'Balance',
  'TsInMs': 'u64',
  'Power': 'u32',
  'DepositId': 'U256',
  'StakingBalanceT': {
    '_enum': {
      'RingBalance': 'Balance',
      'KtonBalance': 'Balance'
    }
  },
  'StakingLedgerT': {
    'stash': 'AccountId',
    'activeRing': 'Compact<Balance>',
    'activeDepositRing': 'Compact<Balance>',
    'activeKton': 'Compact<Balance>',
    'depositItems': 'Vec<TimeDepositItem>',
    'ringStakingLock': 'StakingLock',
    'ktonStakingLock': 'StakingLock',
    'claimedRewards': 'Vec<EraIndex>'
  },
  'TimeDepositItem': {
    'value': 'Compact<Balance>',
    'startTime': 'Compact<TsInMs>',
    'expireTime': 'Compact<TsInMs>'
  },
  'ExposureT': {
    'ownRingBalance': 'Compact<Balance>',
    'ownKtonBalance': 'Compact<Balance>',
    'ownPower': 'Power',
    'totalPower': 'Power',
    'others': 'Vec<IndividualExposure>'
  },
  'Exposure': 'ExposureT',
  'IndividualExposure': {
    'who': 'AccountId',
    'ringBalance': 'Compact<Balance>',
    'ktonBalance': 'Compact<Balance>',
    'power': 'Power'
  },
  'ElectionResultT': {
    'electedStashes': 'Vec<AccountId>',
    'exposures': 'Vec<(AccountId, ExposureT)>',
    'compute': 'ElectionCompute'
  },
  'RKT': {
    'r': 'Balance',
    'k': 'Balance'
  },
  'SpanRecord': {
    'slashed': 'RKT',
    'paidOut': 'RKT'
  },
  'UnappliedSlash': {
    'validator': 'AccountId',
    'own': 'RKT',
    'others': 'Vec<(AccountId, RKT)>',
    'reporters': 'Vec<AccountId>',
    'payout': 'RKT'
  },
  'TreasuryProposal': {
    'proposer': 'AccountId',
    'beneficiary': 'AccountId',
    'ringValue': 'Balance',
    'ktonValue': 'Balance',
    'ringBond': 'Balance',
    'ktonBond': 'Balance'
  },
  'MappedRing': 'u128',
  'EthereumTransactionIndex': '(H256, u64)',
  'EthereumBlockNumber': 'u64',
  'EthereumHeader': {
    'parent_hash': 'H256',
    'timestamp': 'u64',
    'number': 'EthereumBlockNumber',
    'author': 'EthereumAddress',
    'transactions_root': 'H256',
    'uncles_hash': 'H256',
    'extra_data': 'Bytes',
    'state_root': 'H256',
    'receipts_root': 'H256',
    'log_bloom': 'Bloom',
    'gas_used': 'U256',
    'gas_limit': 'U256',
    'difficulty': 'U256',
    'seal': 'Vec<Bytes>',
    'hash': 'H256'
  },
  'EthereumAddress': 'H160',
  'Bloom': '[u8; 256; Bloom]',
  'H128': '[u8; 16; H128]',
  'EthashProof': {
    'dagNodes': '(H512, H512)',
    'proof': 'Vec<H128>'
  },
  'EthereumReceipt': {
    'gasUsed': 'U256',
    'logBloom': 'Bloom',
    'logs': 'Vec<LogEntry>',
    'outcome': 'TransactionOutcome'
  },
  'LogEntry': {},
  'TransactionOutcome': {},
  'EthereumNetworkType': {
    '_enum': {
      'Mainnet': null,
      'Ropsten': null
    }
  },
  'RedeemFor': {
    '_enum': {
      'Token': null,
      'Deposit': null
    }
  },
  'EthereumReceiptProof': {
    'index': 'u64',
    'proof': 'Bytes',
    'headerHash': 'H256'
  },
  'EthereumReceiptProofThing': '(EthereumHeader, EthereumReceiptProof, MMRProof)',
  'MMRProof': {
    'memberLeafIndex': 'u64',
    'lastLeafIndex': 'u64',
    'proof': 'Vec<H256>'
  },
  'EthereumRelayHeaderParcel': {
    'header': 'EthereumHeader',
    'mmrRoot': 'H256'
  },
  'EthereumRelayProofs': {
    'ethashProof': 'Vec<EthashProof>',
    'mmrProof': 'Vec<H256>'
  },
  'OtherSignature': {
    '_enum': {
      'Eth': 'EcdsaSignature',
      'Tron': 'EcdsaSignature'
    }
  },
  'EcdsaSignature': '[u8; 65; EcdsaSignature]',
  'TronAddress': 'EthereumAddress',
  'OtherAddress': {
    '_enum': {
      'Eth': 'EthereumAddress',
      'Tron': 'TronAddress'
    }
  },
  'AddressT': '[u8; 20; AddressT]',
  'MerkleMountainRangeRootLog': {
    'prefix': '[u8; 4; Prefix]',
    'ParentMmrRoot': 'Hash'
  },
  'ChainProperties': {
    'ss58Format': 'Option<u8>',
    'tokenDecimals': 'Option<Vec<u32>>',
    'tokenSymbol': 'Option<Vec<Text>>'
  },
  'AccountInfo': {
    'nonce': 'Index',
    'refcount': 'RefCount',
    'data': 'AccountData'
  },
  'Signer': 'EthereumAddress',
  'RelayAuthorityT': {
    'accountId': 'AccountId',
    'signer': 'Signer',
    'stake': 'Balance',
    'term': 'BlockNumber'
  },
  'MMRRoot': 'Hash',
  'EcdsaAddress': 'EthereumAddress',
  'EcdsaMessage': 'H256',
  'RelayAuthoritySigner': 'EcdsaAddress',
  'RelayAuthorityMessage': 'EcdsaMessage',
  'RelayAuthoritySignature': 'EcdsaSignature',
  'Term': 'BlockNumber',
  'OpCode': '[u8; 4; OpCode]',
  'ScheduledAuthoritiesChangeT': {
    'nextAuthorities': 'Vec<RelayAuthorityT>',
    'deadline': 'BlockNumber'
  },
  'ElectionCompute': {
    '_enum': [
      'OnChain',
      'Signed',
      'Authority'
    ]
  },
  'MMRProofResult': {
    'mmrSize': 'u64',
    'proof': 'Text'
  },
  'ProxyDefinition': {
    'delegate': 'AccountId',
    'proxyType': 'ProxyType',
    'delay': 'BlockNumber'
  },
  'ProxyType': {
    '_enum': {
      'Any': null,
      'NonTransfer': null,
      'Governance': null,
      'Staking': null,
      'IdentityJudgement': null,
      'EthereumBridge': null
    }
  },
  'ProxyAnnouncement': {
    'real': 'AccountId',
    'callHash': 'Hash',
    'height': 'BlockNumber'
  },
  'Announcement': 'ProxyAnnouncement',
  'RelayHeaderId': 'EthereumBlockNumber',
  'RelayHeaderParcel': 'EthereumRelayHeaderParcel',
  'RelayProofs': 'EthereumRelayProofs',
  'RelayAffirmationId': {
    'relayHeaderId': 'EthereumBlockNumber',
    'round': 'u32',
    'index': 'u32'
  },
  'RelayAffirmationT': {
    'relayer': 'AccountId',
    'relayHeaderParcels': 'EthereumRelayHeaderParcel',
    'bond': 'Balance',
    'maybeExtendedRelayAffirmationId': 'Option<RelayAffirmationId>',
    'verified': 'bool'
  },
  'RelayVotingState': {
    'ayes': 'Vec<AccountId>',
    'nays': 'Vec<AccountId>'
  },
  'PowerOf': {
    'power': 'Power'
  }
};
