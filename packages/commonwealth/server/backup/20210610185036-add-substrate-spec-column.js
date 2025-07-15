'use strict';

const specs = {
  edgeware: {
    types: {
      Balance2: 'u128',
      ChainId: 'u8',
      DepositNonce: 'u64',
      ResourceId: '[u8; 32]',
      ProposalStatus: {
        _enum: ['Initiated', 'Approved', 'Rejected'],
      },
      ProposalVotes: {
        votes_for: 'Vec<AccountId>',
        votes_against: 'Vec<AccountId>',
        staus: 'ProposalStatus',
        expiry: 'BlockNumber',
      },
      VoteStage: {
        _enum: ['PreVoting', 'Commit', 'Voting', 'Completed'],
      },
      VoteType: {
        _enum: ['Binary', 'MultiOption', 'RankedChoice'],
      },
      TallyType: {
        _enum: ['OnePerson', 'OneCoin'],
      },
      VoteOutcome: '[u8; 32]',
      VotingTally: 'Option<Vec<(VoteOutcome, u128)>>',
      VoteData: {
        initiator: 'AccountId',
        stage: 'VoteStage',
        vote_type: 'VoteType',
        tally_type: 'TallyType',
        is_commit_reveal: 'bool',
      },
      Commitments: 'Vec<(AccountId, VoteOutcome)>',
      Reveals: 'Vec<(AccountId, Vec<VoteOutcome>)>',
      VoteRecord: {
        id: 'u64',
        commitments: 'Commitments',
        reveals: 'Reveals',
        data: 'VoteData',
        outcomes: 'Vec<VoteOutcome>',
      },
      ProposalRecord: {
        index: 'u32',
        author: 'AccountId',
        stage: 'VoteStage',
        transition_time: 'u32',
        title: 'Text',
        contents: 'Text',
        vote_id: 'u64',
      },
      ProposalContents: 'Bytes',
      ProposalTitle: 'Bytes',
      AccountInfo: 'AccountInfoWithRefCount',
      Address: 'MultiAddress',
      LookupSource: 'MultiAddress',
    },
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
    },
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
    },
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
      AccountInfo: 'AccountInfoWithDualRefCount',
      Address: 'AccountId',
      AddressInfo: 'Vec<u8>',
      LookupSource: 'AccountId',
      Guarantee: {
        targets: 'Vec<IndividualExposure<AccountId, Balance>>',
        total: 'Compact<Balance>',
        submitted_in: 'EraIndex',
        suppressed: 'bool',
      },
      ValidatorPrefs: {
        guarantee_fee: 'Compact<Perbill>',
      },
      ETHAddress: 'Vec<u8>',
      EthereumTxHash: 'H256',
      FileInfo: {
        file_size: 'u64',
        expired_on: 'BlockNumber',
        calculated_at: 'BlockNumber',
        amount: 'Balance',
        prepaid: 'Balance',
        reported_replica_count: 'u32',
        replicas: 'Vec<Replica<AccountId>>',
      },
      UsedInfo: {
        used_size: 'u64',
        reported_group_count: 'u32',
        groups: 'BTreeMap<SworkerAnchor, bool>',
      },
      Status: {
        _enum: ['Free', 'Reserved'],
      },
      Replica: {
        who: 'AccountId',
        valid_at: 'BlockNumber',
        anchor: 'SworkerAnchor',
        is_reported: 'bool',
      },
      Releases: {
        _enum: ['V1_0_0', 'V2_0_0'],
      },
      MerchantLedger: {
        reward: 'Balance',
        collateral: 'Balance',
      },
      IASSig: 'Vec<u8>',
      Identity: {
        anchor: 'SworkerAnchor',
        punishment_deadline: 'u64',
        group: 'Option<AccountId>',
      },
      ISVBody: 'Vec<u8>',
      MerkleRoot: 'Vec<u8>',
      ReportSlot: 'u64',
      PKInfo: {
        code: 'SworkerCode',
        anchor: 'Option<SworkerAnchor>',
      },
      SworkerAnchor: 'Vec<u8>',
      SworkerCert: 'Vec<u8>',
      SworkerCode: 'Vec<u8>',
      SworkerPubKey: 'Vec<u8>',
      SworkerSignature: 'Vec<u8>',
      WorkReport: {
        report_slot: 'u64',
        used: 'u64',
        free: 'u64',
        reported_files_size: 'u64',
        reported_srd_root: 'MerkleRoot',
        reported_files_root: 'MerkleRoot',
      },
      CSMUnlockChunk: {
        value: 'Compact<Balance>',
        bn: 'Compact<BlockNumber>',
      },
      CSMLedger: {
        total: 'Compact<Balance>',
        active: 'Compact<Balance>',
        unlocking: 'Vec<CSMUnlockChunk<Balance>>',
      },
      EraBenefits: {
        total_benefits: 'Balance',
        total_funds: 'Balance',
        used_benefits: 'Balance',
        active_era: 'EraIndex',
      },
      FeeReductionBenefit: {
        funds: 'Balance',
        total_fee_reduction_count: 'u32',
        used_fee_reduction_quota: 'Balance',
        used_fee_reduction_count: 'u32',
        refreshed_at: 'EraIndex',
      },
    },
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
        params: 'Lockdrop',
      },
      ClaimId: 'H256',
      ClaimVote: {
        approve: 'bool',
        authority: 'u16',
        claim_id: 'ClaimId',
      },
      DollarRate: 'u128',
      Keys: 'SessionKeys2',
      Lockdrop: {
        duration: 'u64',
        public_key: '[u8; 33]',
        transaction_hash: 'H256',
        type: 'u8',
        value: 'u128',
      },
      PredicateHash: 'H256',
      RefCount: 'u8',
      TickerRate: {
        authority: 'u16',
        btc: 'u128',
        eth: 'u128',
      },
    },
  },
  darwinia: {
    types: {
      UsableBalance: {
        usableBalance: 'Balance',
      },
      Status: {
        _enum: {
          Free: null,
          Reserved: null,
        },
      },
      Address: 'AccountId',
      LookupSource: 'AccountId',
      BalanceInfo: {},
      BalanceLock: {
        id: 'LockIdentifier',
        lockFor: 'LockFor',
        reasons: 'Reasons',
      },
      LockFor: {
        _enum: {
          Common: 'Common',
          Staking: 'StakingLock',
        },
      },
      Common: {
        amount: 'Balance',
      },
      StakingLock: {
        stakingAmount: 'Balance',
        unbondings: 'Vec<Unbonding>',
      },
      Reasons: {
        _enum: ['Fee', 'Misc', 'All'],
      },
      Unbonding: {
        amount: 'Balance',
        moment: 'BlockNumber',
      },
      AccountData: {
        free: 'Balance',
        reserved: 'Balance',
        freeKton: 'Balance',
        reservedKton: 'Balance',
      },
      RingBalance: 'Balance',
      KtonBalance: 'Balance',
      TsInMs: 'u64',
      Power: 'u32',
      DepositId: 'U256',
      StakingBalanceT: {
        _enum: {
          RingBalance: 'Balance',
          KtonBalance: 'Balance',
        },
      },
      StakingLedgerT: {
        stash: 'AccountId',
        activeRing: 'Compact<Balance>',
        activeDepositRing: 'Compact<Balance>',
        activeKton: 'Compact<Balance>',
        depositItems: 'Vec<TimeDepositItem>',
        ringStakingLock: 'StakingLock',
        ktonStakingLock: 'StakingLock',
        claimedRewards: 'Vec<EraIndex>',
      },
      TimeDepositItem: {
        value: 'Compact<Balance>',
        startTime: 'Compact<TsInMs>',
        expireTime: 'Compact<TsInMs>',
      },
      ExposureT: {
        ownRingBalance: 'Compact<Balance>',
        ownKtonBalance: 'Compact<Balance>',
        ownPower: 'Power',
        totalPower: 'Power',
        others: 'Vec<IndividualExposure>',
      },
      Exposure: 'ExposureT',
      IndividualExposure: {
        who: 'AccountId',
        ringBalance: 'Compact<Balance>',
        ktonBalance: 'Compact<Balance>',
        power: 'Power',
      },
      ElectionResultT: {
        electedStashes: 'Vec<AccountId>',
        exposures: 'Vec<(AccountId, ExposureT)>',
        compute: 'ElectionCompute',
      },
      RKT: {
        r: 'Balance',
        k: 'Balance',
      },
      SpanRecord: {
        slashed: 'RKT',
        paidOut: 'RKT',
      },
      UnappliedSlash: {
        validator: 'AccountId',
        own: 'RKT',
        others: 'Vec<(AccountId, RKT)>',
        reporters: 'Vec<AccountId>',
        payout: 'RKT',
      },
      TreasuryProposal: {
        proposer: 'AccountId',
        beneficiary: 'AccountId',
        ringValue: 'Balance',
        ktonValue: 'Balance',
        ringBond: 'Balance',
        ktonBond: 'Balance',
      },
      MappedRing: 'u128',
      EthereumTransactionIndex: '(H256, u64)',
      EthereumBlockNumber: 'u64',
      EthereumHeader: {
        parent_hash: 'H256',
        timestamp: 'u64',
        number: 'EthereumBlockNumber',
        author: 'EthereumAddress',
        transactions_root: 'H256',
        uncles_hash: 'H256',
        extra_data: 'Bytes',
        state_root: 'H256',
        receipts_root: 'H256',
        log_bloom: 'Bloom',
        gas_used: 'U256',
        gas_limit: 'U256',
        difficulty: 'U256',
        seal: 'Vec<Bytes>',
        hash: 'H256',
      },
      EthereumAddress: 'H160',
      Bloom: '[u8; 256; Bloom]',
      H128: '[u8; 16; H128]',
      EthashProof: {
        dagNodes: '(H512, H512)',
        proof: 'Vec<H128>',
      },
      EthereumReceipt: {
        gasUsed: 'U256',
        logBloom: 'Bloom',
        logs: 'Vec<LogEntry>',
        outcome: 'TransactionOutcome',
      },
      LogEntry: {},
      TransactionOutcome: {},
      EthereumNetworkType: {
        _enum: {
          Mainnet: null,
          Ropsten: null,
        },
      },
      RedeemFor: {
        _enum: {
          Token: null,
          Deposit: null,
        },
      },
      EthereumReceiptProof: {
        index: 'u64',
        proof: 'Bytes',
        headerHash: 'H256',
      },
      EthereumReceiptProofThing:
        '(EthereumHeader, EthereumReceiptProof, MMRProof)',
      MMRProof: {
        memberLeafIndex: 'u64',
        lastLeafIndex: 'u64',
        proof: 'Vec<H256>',
      },
      EthereumRelayHeaderParcel: {
        header: 'EthereumHeader',
        mmrRoot: 'H256',
      },
      EthereumRelayProofs: {
        ethashProof: 'Vec<EthashProof>',
        mmrProof: 'Vec<H256>',
      },
      OtherSignature: {
        _enum: {
          Eth: 'EcdsaSignature',
          Tron: 'EcdsaSignature',
        },
      },
      EcdsaSignature: '[u8; 65; EcdsaSignature]',
      TronAddress: 'EthereumAddress',
      OtherAddress: {
        _enum: {
          Eth: 'EthereumAddress',
          Tron: 'TronAddress',
        },
      },
      AddressT: '[u8; 20; AddressT]',
      MerkleMountainRangeRootLog: {
        prefix: '[u8; 4; Prefix]',
        ParentMmrRoot: 'Hash',
      },
      ChainProperties: {
        ss58Format: 'Option<u8>',
        tokenDecimals: 'Option<Vec<u32>>',
        tokenSymbol: 'Option<Vec<Text>>',
      },
      AccountInfo: {
        nonce: 'Index',
        refcount: 'RefCount',
        data: 'AccountData',
      },
      Signer: 'EthereumAddress',
      RelayAuthorityT: {
        accountId: 'AccountId',
        signer: 'Signer',
        stake: 'Balance',
        term: 'BlockNumber',
      },
      MMRRoot: 'Hash',
      EcdsaAddress: 'EthereumAddress',
      EcdsaMessage: 'H256',
      RelayAuthoritySigner: 'EcdsaAddress',
      RelayAuthorityMessage: 'EcdsaMessage',
      RelayAuthoritySignature: 'EcdsaSignature',
      Term: 'BlockNumber',
      OpCode: '[u8; 4; OpCode]',
      ScheduledAuthoritiesChangeT: {
        nextAuthorities: 'Vec<RelayAuthorityT>',
        deadline: 'BlockNumber',
      },
      ElectionCompute: {
        _enum: ['OnChain', 'Signed', 'Authority'],
      },
      MMRProofResult: {
        mmrSize: 'u64',
        proof: 'Text',
      },
      ProxyDefinition: {
        delegate: 'AccountId',
        proxyType: 'ProxyType',
        delay: 'BlockNumber',
      },
      ProxyType: {
        _enum: {
          Any: null,
          NonTransfer: null,
          Governance: null,
          Staking: null,
          IdentityJudgement: null,
          EthereumBridge: null,
        },
      },
      ProxyAnnouncement: {
        real: 'AccountId',
        callHash: 'Hash',
        height: 'BlockNumber',
      },
      Announcement: 'ProxyAnnouncement',
      RelayHeaderId: 'EthereumBlockNumber',
      RelayHeaderParcel: 'EthereumRelayHeaderParcel',
      RelayProofs: 'EthereumRelayProofs',
      RelayAffirmationId: {
        relayHeaderId: 'EthereumBlockNumber',
        round: 'u32',
        index: 'u32',
      },
      RelayAffirmationT: {
        relayer: 'AccountId',
        relayHeaderParcels: 'EthereumRelayHeaderParcel',
        bond: 'Balance',
        maybeExtendedRelayAffirmationId: 'Option<RelayAffirmationId>',
        verified: 'bool',
      },
      RelayVotingState: {
        ayes: 'Vec<AccountId>',
        nays: 'Vec<AccountId>',
      },
      PowerOf: {
        power: 'Power',
      },
    },
  },
};

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.addColumn(
        'Chains',
        'substrate_spec',
        {
          type: Sequelize.JSONB,
          allowNull: true,
        },
        { transaction: t }
      );

      // initialize existing specs
      for (const [key, spec] of Object.entries(specs)) {
        await queryInterface.sequelize.query(
          `UPDATE "Chains" SET substrate_spec = '${JSON.stringify(
            spec
          )}' WHERE id = '${key}'`,
          { transaction: t }
        );
      }
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeColumn('Chains', 'substrate_spec', {
        transaction: t,
      });
    });
  },
};
