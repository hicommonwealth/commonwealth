import crypto from 'crypto';
import { EventSupportingChains, SubstrateTypes, MolochTypes, chainSupportedBy } from '@commonwealth/chain-events';

import { NotificationCategories } from '../../shared/types';
import { ADDRESS_TOKEN_EXPIRES_IN } from '../config';
import { factory, formatFilename } from '../../shared/logging';
const log = factory.getLogger(formatFilename(__filename));

const nodes = [
  [ 'ws://localhost:9944', 'edgeware-local' ],
  [ 'wss://beresheet1.edgewa.re', 'edgeware-testnet' ],
  [ 'wss://beresheet2.edgewa.re', 'edgeware-testnet' ],
  [ 'wss://beresheet3.edgewa.re', 'edgeware-testnet' ],
  [ 'ws://mainnet1.edgewa.re:9944', 'edgeware' ],
  // [ 'localhost:9944', 'kusama-local' ],
  [ 'wss://kusama-rpc.polkadot.io', 'kusama' ],
  [ 'wss://rpc.polkadot.io', 'polkadot' ],
  // [ 'ws://127.0.0.1:7545', 'ethereum-local' ],
  // [ 'wss://mainnet.infura.io/ws', 'ethereum' ],
  // [ '18.223.143.102:9944', 'edgeware-testnet' ],
  // [ '157.230.218.41:9944', 'edgeware-testnet' ],
  // [ '157.230.125.18:9944', 'edgeware-testnet' ],
  // [ '206.189.33.216:9944', 'edgeware-testnet' ],
  // [ 'localhost:26657', 'cosmos-local' ],
  [ 'gaia13k1.commonwealth.im:26657', 'cosmos-testnet' ],
  [ 'wss://api.cosmos.network', 'cosmos' ],
  [ 'wss://straightedge.commonwealth.im', 'straightedge' ],
  [ 'http://localhost:3030', 'near-local' ],
  [ 'https://rpc.nearprotocol.com', 'near' ],
  [ 'wss://mainnet.infura.io/ws', 'moloch', '0x1fd169A4f5c59ACf79d0Fd5d91D1201EF1Bce9f1'],
  [ 'wss://rpc.kulupu.corepaper.org/ws', 'kulupu'],
  [ 'wss://rpc.plasmnet.io/ws', 'plasm'],
  [ 'wss://scan-rpc.stafi.io/ws', 'stafi'],
  [ 'wss://api.crust.network/', 'crust'],
  [ 'wss://cc1.darwinia.network/ws', 'darwinia'],
  [ 'wss://poc3.phala.com/ws', 'phala'],
  [ 'wss://fullnode.centrifuge.io', 'centrifuge'],
  [ 'wss://mainnet.infura.io/ws', 'marlin', '0xEa2923b099b4B588FdFAD47201d747e3b9599A5f'],
  [ 'ws://127.0.0.1:9545', 'marlin-local', '0xe0D6a92B91B83D5c8A95557f1c966cAFd97f7171'], // TODO: Can't seem to keep this consistent which each local deploy
  [ 'ws://api.clover.finance', 'clover'],
  [ 'wss://rpc-01.snakenet.hydradx.io', 'hydradx'],
  [ 'wss://ropsten.infura.io/ws', 'alex-ropsten', '0xFab46E002BbF0b4509813474841E0716E6730136']
];

const specs = {
  edgeware: {
    types: {
      'Balance2': 'u128',
      'ChainId': 'u8',
      'DepositNonce': 'u64',
      'ResourceId': '[u8; 32]',
      'ProposalStatus': {
        '_enum': [
          'Initiated',
          'Approved',
          'Rejected'
        ]
      },
      'ProposalVotes': {
        'votes_for': 'Vec<AccountId>',
        'votes_against': 'Vec<AccountId>',
        'staus': 'ProposalStatus',
        'expiry': 'BlockNumber'
      },
      'VoteStage': {
        '_enum': [
          'PreVoting',
          'Commit',
          'Voting',
          'Completed'
        ]
      },
      'VoteType': {
        '_enum': [
          'Binary',
          'MultiOption',
          'RankedChoice'
        ]
      },
      'TallyType': {
        '_enum': [
          'OnePerson',
          'OneCoin'
        ]
      },
      'VoteOutcome': '[u8; 32]',
      'VotingTally': 'Option<Vec<(VoteOutcome, u128)>>',
      'VoteData': {
        'initiator': 'AccountId',
        'stage': 'VoteStage',
        'vote_type': 'VoteType',
        'tally_type': 'TallyType',
        'is_commit_reveal': 'bool'
      },
      'Commitments': 'Vec<(AccountId, VoteOutcome)>',
      'Reveals': 'Vec<(AccountId, Vec<VoteOutcome>)>',
      'VoteRecord': {
        'id': 'u64',
        'commitments': 'Commitments',
        'reveals': 'Reveals',
        'data': 'VoteData',
        'outcomes': 'Vec<VoteOutcome>'
      },
      'ProposalRecord': {
        'index': 'u32',
        'author': 'AccountId',
        'stage': 'VoteStage',
        'transition_time': 'u32',
        'title': 'Text',
        'contents': 'Text',
        'vote_id': 'u64'
      },
      'ProposalContents': 'Bytes',
      'ProposalTitle': 'Bytes',
      'AccountInfo': 'AccountInfoWithRefCount',
      'Address': 'MultiAddress',
      'LookupSource': 'MultiAddress'
    }
  },
  stafi: {
    typesBundle: {
      spec: {
        node: {
          types: [
            {
              // on all versions
              minmax: [0, undefined],
              types: {
                RefCount: 'u32',
                ChainId: 'u8',
                ResourceId: '[u8; 32]',
                DepositNonce: 'u64',
                RateType: 'u64',
                AccountRData: {
                  free: 'u128',
                },
                RSymbol: {
                  _enum: ['RFIS', 'RDOT', 'RKSM', 'RATOM'],
                },
                AccountXData: {
                  free: 'u128',
                },
                XSymbol: {
                  _enum: ['WRA'],
                },
                ProposalStatus: {
                  _enum: ['Active', 'Passed', 'Expired', 'Executed'],
                },
                ProposalVotes: {
                  voted: 'Vec<AccountId>',
                  status: 'ProposalStatus',
                  expiry: 'BlockNumber',
                },
                BondRecord: {
                  bonder: 'AccountId',
                  symbol: 'RSymbol',
                  pubkey: 'Vec<u8>',
                  pool: 'Vec<u8>',
                  blockhash: 'Vec<u8>',
                  txhash: 'Vec<u8>',
                  amount: 'u128',
                },
                BondReason: {
                  _enum: [
                    'Pass',
                    'BlockhashUnmatch',
                    'TxhashUnmatch',
                    'PubkeyUnmatch',
                    'PoolUnmatch',
                    'AmountUnmatch',
                  ],
                },
                BondState: {
                  _enum: ['Dealing', 'Fail', 'Success'],
                },
                SigVerifyResult: {
                  _enum: ['InvalidPubkey', 'Fail', 'Pass'],
                },
                PoolBondState: {
                  _enum: [
                    'EraUpdated',
                    'BondReported',
                    'ActiveReported',
                    'WithdrawSkipped',
                    'WithdrawReported',
                    'TransferReported',
                  ],
                },
                BondSnapshot: {
                  symbol: 'RSymbol',
                  era: 'u32',
                  pool: 'Vec<u8>',
                  bond: 'u128',
                  unbond: 'u128',
                  active: 'u128',
                  last_voter: 'AccountId',
                  bond_state: 'PoolBondState',
                },
                LinkChunk: {
                  bond: 'u128',
                  unbond: 'u128',
                  active: 'u128',
                },
                OriginalTxType: {
                  _enum: [
                    'Transfer',
                    'Bond',
                    'Unbond',
                    'WithdrawUnbond',
                    'ClaimRewards',
                  ],
                },
                Unbonding: {
                  who: 'AccountId',
                  value: 'u128',
                  recipient: 'Vec<u8>',
                },
                UserUnlockChunk: {
                  pool: 'Vec<u8>',
                  unlock_era: 'u32',
                  value: 'u128',
                  recipient: 'Vec<u8>',
                },
                RproposalStatus: {
                  _enum: ['Initiated', 'Approved', 'Rejected', 'Expired'],
                },
                RproposalVotes: {
                  votes_for: 'Vec<AccountId>',
                  votes_against: 'Vec<AccountId>',
                  status: 'RproposalStatus',
                  expiry: 'BlockNumber',
                },
              },
            },
          ],
        },
      },
    },
  },
  clover: {
    types: {
      Amount: 'i128',
      Keys: 'SessionKeys4',
      AmountOf: 'Amount',
      Balance: 'u128',
      Rate: 'FixedU128',
      Ratio: 'FixedU128',
      EcdsaSignature: '[u8; 65]',
      EvmAddress: 'H160',
      EthereumTxHash: 'H256',
      BridgeNetworks: {
        _enum: ['BSC', 'Ethereum'],
      },
      AccountInfo: 'AccountInfoWithDualRefCount',
    }
  },
  hydradx: {
    types: {
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
    }
  },
  kulupu: {
    typesBundle: {
      spec: {
        kulupu: {
          types: [
            {
              // on all versions
              minmax: [0, undefined],
              types: {
                CurvePoint: {
                  start: 'BlockNumber',
                  reward: 'Balance',
                  taxation: 'Perbill',
                },
                Difficulty: 'U256',
                DifficultyAndTimestamp: {
                  difficulty: 'Difficulty',
                  timestamp: 'Moment',
                },
                Era: {
                  genesisBlockHash: 'H256',
                  finalBlockHash: 'H256',
                  finalStateRoot: 'H256',
                },
              },
            },
            {
              // swap to MultiAddress in runtime 13
              minmax: [13, undefined],
              types: {
                Address: 'MultiAddress',
                LookupSource: 'MultiAddress',
              },
            },
            {
              // enable pallet-lockdrop in runtime 17
              minmax: [17, undefined],
              types: {
                CampaignIdentifier: '[u8; 4]',
              },
            },
          ],
        },
      },
    },
  },
  crust: {
    types: {
      'AccountInfo': 'AccountInfoWithDualRefCount',
      'Address': 'AccountId',
      'AddressInfo': 'Vec<u8>',
      'LookupSource': 'AccountId',
      'Guarantee': {
        'targets': 'Vec<IndividualExposure<AccountId, Balance>>',
        'total': 'Compact<Balance>',
        'submitted_in': 'EraIndex',
        'suppressed': 'bool'
      },
      'ValidatorPrefs': {
        'guarantee_fee': 'Compact<Perbill>'
      },
      'ETHAddress': 'Vec<u8>',
      'EthereumTxHash': 'H256',
      'FileInfo': {
        'file_size': 'u64',
        'expired_on': 'BlockNumber',
        'calculated_at': 'BlockNumber',
        'amount': 'Balance',
        'prepaid': 'Balance',
        'reported_replica_count': 'u32',
        'replicas': 'Vec<Replica<AccountId>>'
      },
      'UsedInfo': {
        'used_size': 'u64',
        'reported_group_count': 'u32',
        'groups': 'BTreeMap<SworkerAnchor, bool>'
      },
      'Status': {
        '_enum': [
          'Free',
          'Reserved'
        ]
      },
      'Replica': {
        'who': 'AccountId',
        'valid_at': 'BlockNumber',
        'anchor': 'SworkerAnchor',
        'is_reported': 'bool'
      },
      'Releases': {
        '_enum': [
          'V1_0_0',
          'V2_0_0'
        ]
      },
      'MerchantLedger': {
        'reward': 'Balance',
        'collateral': 'Balance'
      },
      'IASSig': 'Vec<u8>',
      'Identity': {
        'anchor': 'SworkerAnchor',
        'punishment_deadline': 'u64',
        'group': 'Option<AccountId>'
      },
      'ISVBody': 'Vec<u8>',
      'MerkleRoot': 'Vec<u8>',
      'ReportSlot': 'u64',
      'PKInfo': {
        'code': 'SworkerCode',
        'anchor': 'Option<SworkerAnchor>'
      },
      'SworkerAnchor': 'Vec<u8>',
      'SworkerCert': 'Vec<u8>',
      'SworkerCode': 'Vec<u8>',
      'SworkerPubKey': 'Vec<u8>',
      'SworkerSignature': 'Vec<u8>',
      'WorkReport': {
        'report_slot': 'u64',
        'used': 'u64',
        'free': 'u64',
        'reported_files_size': 'u64',
        'reported_srd_root': 'MerkleRoot',
        'reported_files_root': 'MerkleRoot'
      },
      'CSMUnlockChunk': {
        'value': 'Compact<Balance>',
        'bn': 'Compact<BlockNumber>'
      },
      'CSMLedger': {
        'total': 'Compact<Balance>',
        'active': 'Compact<Balance>',
        'unlocking': 'Vec<CSMUnlockChunk<Balance>>'
      },
      'EraBenefits': {
        'total_benefits': 'Balance',
        'total_funds': 'Balance',
        'used_benefits': 'Balance',
        'active_era': 'EraIndex'
      },
      'FeeReductionBenefit': {
        'funds': 'Balance',
        'total_fee_reduction_count': 'u32',
        'used_fee_reduction_quota': 'Balance',
        'used_fee_reduction_count': 'u32',
        'refreshed_at': 'EraIndex'
      }
    }
  },
  plasm: {
    types: {
      AuthorityId: 'AccountId',
      AuthorityVote: 'u32',
      Claim: {
        amount: 'u128',
        approve: 'BTreeSet<AuthorityId>',
        complete: 'bool',
        decline: 'BTreeSet<AuthorityId>',
        params: 'Lockdrop'
      },
      ClaimId: 'H256',
      ClaimVote: {
        approve: 'bool',
        authority: 'u16',
        claim_id: 'ClaimId'
      },
      DollarRate: 'u128',
      Keys: 'SessionKeys2',
      Lockdrop: {
        duration: 'u64',
        public_key: '[u8; 33]',
        transaction_hash: 'H256',
        type: 'u8',
        value: 'u128'
      },
      PredicateHash: 'H256',
      RefCount: 'u8',
      TickerRate: {
        authority: 'u16',
        btc: 'u128',
        eth: 'u128'
      }
    }
  },
  darwinia: {
    types: {
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
        'reservedKton': 'Balance'
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
    },
  },
};

const resetServer = (models): Promise<number> => {
  log.debug('Resetting database...');
  return new Promise((resolve) => {
    models.sequelize.sync({ force: true }).then(async () => {
      log.debug('Initializing default models...');
      // Users
      const [dillon, raymond, drew] = await Promise.all([
        models.User.create({
          email: 'dillon@commonwealth.im',
          emailVerified: true,
          isAdmin: true,
          lastVisited: '{}',
        }),
        models.User.create({
          email: 'raymond@commonwealth.im',
          emailVerified: true,
          isAdmin: true,
          lastVisited: '{}',
        }),
        models.User.create({
          email: 'drew@commonwealth.im',
          emailVerified: true,
          isAdmin: true,
          lastVisited: '{}',
        }),
      ]);

      // Initialize contract categories for all smart contract supporting chains
      await Promise.all([
        models.ContractCategory.create({
          name: 'Tokens',
          description: 'Token related contracts',
          color: '#4a90e2',
        }),
        models.ContractCategory.create({
          name: 'DAOs',
          description: 'DAO related contracts',
          color: '#9013fe',
        }),
      ]);

      // Initialize different chain + node URLs
      const chains = await Promise.all([
        models.Chain.create({
          id: 'edgeware-local',
          network: 'edgeware',
          symbol: 'EDG',
          name: 'Edgeware (local)',
          icon_url: '/static/img/protocols/edg.png',
          active: true,
          type: 'chain',
          base: 'substrate',
          ss58_prefix: 7,
        }),
        models.Chain.create({
          id: 'edgeware-testnet',
          network: 'edgeware',
          symbol: 'EDG',
          name: 'Edgeware (testnet)',
          icon_url: '/static/img/protocols/edg.png',
          active: true,
          type: 'chain',
          base: 'substrate',
          ss58_prefix: 7,
        }),
        models.Chain.create({
          id: 'edgeware',
          network: 'edgeware',
          symbol: 'EDG',
          name: 'Edgeware',
          icon_url: '/static/img/protocols/edg.png',
          active: true,
          type: 'chain',
          base: 'substrate',
          ss58_prefix: 7,
          collapsed_on_homepage: false,
          substrate_spec: specs['edgeware'],
        }),
        models.Chain.create({
          id: 'kusama-local',
          network: 'kusama',
          symbol: 'KSM',
          name: 'Kusama (local)',
          icon_url: '/static/img/protocols/ksm.png',
          active: true,
          type: 'chain',
          base: 'substrate',
          ss58_prefix: 42,
        }),
        models.Chain.create({
          id: 'kusama',
          network: 'kusama',
          symbol: 'KSM',
          name: 'Kusama',
          icon_url: '/static/img/protocols/ksm.png',
          active: true,
          type: 'chain',
          base: 'substrate',
          ss58_prefix: 2,
          collapsed_on_homepage: false,
          substrate_spec: specs['kusama'],
        }),
        models.Chain.create({
          id: 'polkadot-local',
          network: 'polkadot',
          symbol: 'DOT',
          name: 'Polkadot (local)',
          icon_url: '/static/img/protocols/dot.png',
          active: true,
          type: 'chain',
          base: 'substrate',
          ss58_prefix: 42,
        }),
        models.Chain.create({
          id: 'polkadot',
          network: 'polkadot',
          symbol: 'DOT',
          name: 'Polkadot',
          icon_url: '/static/img/protocols/dot.png',
          active: true,
          type: 'chain',
          base: 'substrate',
          ss58_prefix: 0,
          collapsed_on_homepage: false,
          substrate_spec: specs['polkadot'],
        }),
        models.Chain.create({
          id: 'kulupu',
          network: 'kulupu',
          symbol: 'KLP',
          name: 'Kulupu',
          icon_url: '/static/img/protocols/klp.png',
          active: true,
          type: 'chain',
          base: 'substrate',
          ss58_prefix: 16,
          collapsed_on_homepage: false,
          substrate_spec: specs['kulupu'],
        }),
        models.Chain.create({
          id: 'plasm',
          network: 'plasm',
          symbol: 'PLM',
          name: 'Plasm',
          icon_url: '/static/img/protocols/plm.png',
          active: true,
          type: 'chain',
          base: 'substrate',
          ss58_prefix: 5,
          collapsed_on_homepage: false,
          substrate_spec: specs['plasm'],
        }),
        models.Chain.create({
          id: 'stafi',
          network: 'stafi',
          symbol: 'FIS',
          name: 'StaFi',
          icon_url: '/static/img/protocols/fis.png',
          active: true,
          type: 'chain',
          base: 'substrate',
          ss58_prefix: 20,
          collapsed_on_homepage: false,
          substrate_spec: specs['stafi'],
        }),
        models.Chain.create({
          id: 'crust',
          network: 'crust',
          symbol: 'CRUST',
          name: 'Crust',
          icon_url: '/static/img/protocols/crust.png',
          active: true,
          type: 'chain',
          base: 'substrate',
          ss58_prefix: 20, // @TODO: Check if true
          collapsed_on_homepage: false,
          substrate_spec: specs['crust'],
        }),
        models.Chain.create({
          id: 'darwinia',
          network: 'darwinia',
          symbol: 'RING',
          name: 'Darwinia',
          icon_url: '/static/img/protocols/ring.png',
          active: true,
          type: 'chain',
          base: 'substrate',
          ss58_prefix: 18,
          collapsed_on_homepage: false,
          substrate_spec: specs['darwinia'],
        }),
        models.Chain.create({
          id: 'phala',
          network: 'phala',
          symbol: 'PHA',
          name: 'Phala Network',
          icon_url: '/static/img/protocols/pha.png',
          active: true,
          type: 'chain',
          base: 'substrate',
          ss58_prefix: 30,
          collapsed_on_homepage: false,
          substrate_spec: specs['phala'],
        }),
        models.Chain.create({
          id: 'centrifuge',
          network: 'centrifuge',
          symbol: 'RAD',
          name: 'Centrifuge',
          icon_url: '/static/img/protocols/rad.png',
          active: true,
          type: 'chain',
          base: 'substrate',
          ss58_prefix: 36,
          collapsed_on_homepage: false,
          substrate_spec: specs['centrifuge'],
        }),
        models.Chain.create({
          id: 'cosmos-local',
          network: 'cosmos',
          symbol: 'stake',
          name: 'Cosmos (local)',
          icon_url: '/static/img/protocols/atom.png',
          active: true,
          type: 'chain',
          base: 'cosmos',
        }),
        models.Chain.create({
          id: 'cosmos-testnet',
          network: 'cosmos',
          symbol: 'muon',
          name: 'Cosmos (Gaia 13006 Testnet)',
          icon_url: '/static/img/protocols/atom.png',
          active: true,
          type: 'chain',
          base: 'cosmos',
        }),
        models.Chain.create({
          id: 'cosmos',
          network: 'cosmos',
          symbol: 'uatom',
          name: 'Cosmos',
          icon_url: '/static/img/protocols/atom.png',
          active: true,
          type: 'chain',
          base: 'cosmos',
          collapsed_on_homepage: false,
        }),
        models.Chain.create({
          id: 'straightedge',
          network: 'straightedge',
          symbol: 'str',
          name: 'Straightedge',
          icon_url: '/static/img/protocols/atom.png',
          active: true,
          type: 'chain',
          base: 'cosmos',
          collapsed_on_homepage: false,
        }),
        // models.Chain.create({
        //   id: 'ethereum-ropsten',
        //   network: 'ethereum',
        //   symbol: 'ETH',
        //   name: 'Ethereum Ropsten',
        //   icon_url: '/static/img/protocols/eth.png',
        //   active: false,
        //   type: 'chain',
        //   base: 'ethereum',
        // }),
        models.Chain.create({
          id: 'ethereum-local',
          network: 'ethereum',
          symbol: 'ETH',
          name: 'Ethereum (local)',
          icon_url: '/static/img/protocols/eth.png',
          active: true,
          type: 'chain',
          base: 'ethereum',
        }),
        models.Chain.create({
          id: 'ethereum',
          network: 'ethereum',
          symbol: 'ETH',
          name: 'Ethereum',
          icon_url: '/static/img/protocols/eth.png',
          active: true,
          type: 'chain',
          base: 'ethereum',
          collapsed_on_homepage: false,
        }),
        models.Chain.create({
          id: 'near-local',
          network: 'near',
          symbol: 'NEAR',
          name: 'NEAR Protocol (local)',
          icon_url: '/static/img/protocols/near.png',
          active: true,
          type: 'chain',
          base: 'near',
        }),
        models.Chain.create({
          id: 'near',
          network: 'near',
          symbol: 'NEAR',
          name: 'NEAR Protocol',
          icon_url: '/static/img/protocols/near.png',
          active: true,
          type: 'chain',
          base: 'near',
          collapsed_on_homepage: false,
        }),
        models.Chain.create({
          id: 'moloch',
          network: 'moloch',
          symbol: 'SHARE',
          name: 'Moloch',
          icon_url: '/static/img/protocols/molochdao.png',
          active: true,
          type: 'dao',
          base: 'ethereum',
          collapsed_on_homepage: false,
        }),
        // This is the same exact as Moloch, but I want to show the picture on the front end
        models.Chain.create({
          id: 'metacartel',
          network: 'metacartel',
          symbol: 'SHARE',
          name: 'Metacartel',
          icon_url: '/static/img/protocols/metacartel.png',
          active: true,
          type: 'dao',
          base: 'ethereum',
          collapsed_on_homepage: false,
        }),
        models.Chain.create({
          id: 'moloch-local',
          network: 'moloch',
          symbol: 'SHARE',
          name: 'Moloch (local)',
          icon_url: '/static/img/protocols/molochdao.png',
          active: true,
          type: 'dao',
          base: 'ethereum',
        }),
        models.Chain.create({
          id: 'marlin',
          network: 'marlin',
          symbol: 'LIN',
          name: 'Marlin',
          icon_url: '/static/img/protocols/eth.png',
          active: true,
          type: 'dao',
          collapsed_on_homepage: false,
        }),
        models.Chain.create({
          id: 'marlin-local',
          network: 'marlin',
          symbol: 'LIN',
          name: 'Marlin (local)',
          icon_url: '/static/img/protocols/eth.png',
          active: true,
          type: 'dao',
        }),
        models.Chain.create({
          id: 'clover',
          network: 'clover',
          symbol: 'CLOV',
          name: 'Clover',
          icon_url: '/static/img/protocols/clover.png',
          active: true,
          type: 'chain',
          collapsed_on_homepage: false,
          substrate_spec: specs['clover'],
        }),
        models.Chain.create({
          id: 'hydradx',
          network: 'hydradx',
          symbol: 'HDX',
          name: 'HydraDX',
          icon_url: '/static/img/protocols/hydradx.png',
          active: true,
          type: 'chain',
          collapsed_on_homepage: false,
          substrate_spec: specs['hydradx'],
        }),
        models.Chain.create({
          id: 'alex-ropsten',
          network: 'alex',
          symbol: 'ALEX',
          name: 'Alex (ropsten)',
          icon_url: '/static/img/protocols/eth.png',
          active: true,
          type: 'token',
          base: 'ethereum',
        }),
      ]);

      // Specific chains
      // Make sure to maintain this list if you make any changes!
      const [
        edgLocal, edgTest, edgMain,
        kusamaLocal, kusamaMain,
        polkadotLocal, polkadotMain,
        kulupuMain,
        atomLocal, atomTestnet, atom,
        // ethRopsten,
        ethLocal, eth,
        nearLocal, nearTestnet,
        moloch, metacartel, molochLocal,
        marlin, marlinLocal,
        alexRopsten,
      ] = chains;

      // Admin roles for specific communities
      await Promise.all([
        models.Address.create({
          user_id: 2,
          address: '0x34C3A5ea06a3A67229fb21a7043243B0eB3e853f',
          chain: 'ethereum',
          selected: true,
          verification_token: crypto.randomBytes(18).toString('hex'),
          verification_token_expires: new Date(+(new Date()) + ADDRESS_TOKEN_EXPIRES_IN * 60 * 1000),
          verified: new Date(),
        }),
        models.Address.create({
          address: '5DJA5ZCobDS3GVn8D2E5YRiotDqGkR2FN1bg6LtfNUmuadwX',
          chain: 'edgeware',
          verification_token: crypto.randomBytes(18).toString('hex'),
          verification_token_expires: new Date(+(new Date()) + ADDRESS_TOKEN_EXPIRES_IN * 60 * 1000),
          verified: true,
          keytype: 'sr25519',
        }),
        models.Address.create({
          address: 'ik52qFh92pboSctWPSFKtQwGEpypzz2m6D5ZRP8AYxqjHpM',
          chain: 'edgeware',
          verification_token: crypto.randomBytes(18).toString('hex'),
          verification_token_expires: new Date(+(new Date()) + ADDRESS_TOKEN_EXPIRES_IN * 60 * 1000),
          verified: true,
          keytype: 'sr25519',
        }),
        models.Address.create({
          address: 'js4NB7G3bqEsSYq4ruj9Lq24QHcoKaqauw6YDPD7hMr1Roj',
          chain: 'edgeware',
          verification_token: crypto.randomBytes(18).toString('hex'),
          verification_token_expires: new Date(+(new Date()) + ADDRESS_TOKEN_EXPIRES_IN * 60 * 1000),
          verified: true,
          keytype: 'sr25519',
        }),
      ]);

      // Notification Categories
      await Promise.all([
        models.NotificationCategory.create({
          name: NotificationCategories.NewCommunity,
          description: 'someone makes a new community'
        }),
        models.NotificationCategory.create({
          name: NotificationCategories.NewThread,
          description: 'someone makes a new thread'
        }),
        models.NotificationCategory.create({
          name: NotificationCategories.NewComment,
          description: 'someone makes a new comment',
        }),
        models.NotificationCategory.create({
          name: NotificationCategories.NewMention,
          description: 'someone @ mentions a user',
        }),
        models.NotificationCategory.create({
          name: NotificationCategories.NewReaction,
          description: 'someone reacts to a post',
        }),
        models.NotificationCategory.create({
          name: NotificationCategories.NewCollaboration,
          description: 'someone reacts to a post',
        }),
        models.NotificationCategory.create({
          name: NotificationCategories.ChainEvent,
          description: 'a chain event occurs',
        }),
      ]);

      // Admins need to be subscribed to mentions and collaborations
      await Promise.all([
        models.Subscription.create({
          subscriber_id: dillon.id,
          category_id: NotificationCategories.NewMention,
          object_id: `user-${dillon.id}`,
          is_active: true,
          immediate_email: true,
        }),
        models.Subscription.create({
          subscriber_id: raymond.id,
          category_id: NotificationCategories.NewMention,
          object_id: `user-${raymond.id}`,
          is_active: true,
          immediate_email: true,
        }),
        models.Subscription.create({
          subscriber_id: drew.id,
          category_id: NotificationCategories.NewMention,
          object_id: `user-${drew.id}`,
          is_active: true,
          immediate_email: true,
        }),
        models.Subscription.create({
          subscriber_id: dillon.id,
          category_id: NotificationCategories.NewCollaboration,
          object_id: `user-${dillon.id}`,
          is_active: true,
          immediate_email: true,
        }),
        models.Subscription.create({
          subscriber_id: raymond.id,
          category_id: NotificationCategories.NewCollaboration,
          object_id: `user-${raymond.id}`,
          is_active: true,
          immediate_email: true,
        }),
        models.Subscription.create({
          subscriber_id: drew.id,
          category_id: NotificationCategories.NewCollaboration,
          object_id: `user-${drew.id}`,
          is_active: true,
          immediate_email: true,
        }),
      ]);

      // Communities
      const communities = await Promise.all([
        models.OffchainCommunity.create({
          id: 'staking',
          name: 'Staking',
          creator_id: 1,
          description: 'All things staking',
          default_chain: 'ethereum',
        }),
        models.OffchainCommunity.create({
          id: 'governance',
          name: 'Governance',
          creator_id: 1,
          description: 'All things governance',
          default_chain: 'ethereum',
        }),
        models.OffchainCommunity.create({
          id: 'meta',
          name: 'Commonwealth Meta',
          creator_id: 1,
          description: 'All things Commonwealth',
          default_chain: 'edgeware',
        })
      ]);

      // Specific communities
      // Make sure to maintain this list if you make any changes!
      const [staking, governance, meta] = communities;

      // OffchainTopics
      await Promise.all(
        chains.map((chain) => models.OffchainTopic.create({
          name: 'General',
          description: 'General discussion about this blockchain\'s chain development and governance',
          chain_id: chain.id,
        }))
          .concat(
            chains.map((chain) => models.OffchainTopic.create({
              name: 'Random',
              description: 'Non-work banter and water cooler conversation',
              chain_id: chain.id,
            }))
          )
          .concat(
            communities.map((community) => models.OffchainTopic.create({
              name: 'General',
              description: 'General discussion',
              community_id: community.id,
            }))
          )
          .concat(
            communities.map((community) => models.OffchainTopic.create({
              name: 'Random',
              description: 'Non-work banter and water cooler conversation',
              community_id: community.id,
            }))
          )
      );

      await Promise.all([
        models.Role.create({
          address_id: 3,
          chain_id: 'edgeware',
          permission: 'admin',
        }),
        models.Role.create({
          address_id: 4,
          chain_id: 'edgeware',
          permission: 'admin',
        }),
        models.Role.create({
          address_id: 3,
          offchain_community_id: 'staking',
          permission: 'admin',
        }),
        models.Role.create({
          address_id: 4,
          offchain_community_id: 'staking',
          permission: 'admin',
        }),
      ]);

      await Promise.all(nodes.map(([ url, chain, address ]) => (models.ChainNode.create({ chain, url, address }))));

      log.debug('Reset database and initialized default models');
      resolve(0);
    }).catch((error) => {
      log.error(error.message);
      log.error('Error syncing db and initializing default models');
      resolve(1);
    });
  });
};

export default resetServer;
