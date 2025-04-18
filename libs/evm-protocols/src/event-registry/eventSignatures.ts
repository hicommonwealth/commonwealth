// TODO: remove when we remove Contest mappers
export const ChainEventSigs = {
  NewContest:
    'address contest, address namespace, uint256 interval, bool oneOff' as const,
  NewRecurringContestStarted:
    'uint256 indexed contestId, uint256 startTime, uint256 endTime' as const,
  NewSingleContestStarted: 'uint256 startTime, uint256 endTime' as const,
  ContentAdded:
    'uint256 indexed contentId, address indexed creator, string url' as const,
  VoterVotedRecurring:
    'address indexed voter, uint256 indexed contentId, uint256 contestId, uint256 votingPower' as const,
  VoterVotedOneOff:
    'address indexed voter, uint256 indexed contentId, uint256 votingPower' as const,
};

export const EvmEventSignatures = {
  NamespaceFactory: {
    NamespaceDeployed:
      '0xc8451dcd95e7ca3d8608dfc9d43e7bf4187f43cf5e07d5143b6c2be3cf73d175',
    NamespaceDeployedWithReferral:
      '0x86bc285ef78f2bf1fc0437d79c9473bf64014e8a483d00a4e4683bde1f9758f7',
    ContestManagerDeployed:
      '0x990f533044dbc89b838acde9cd2c72c400999871cf8f792d731edcae15ead693',
    CommunityNamespaceCreated:
      '0xa16d784cb6c784b621c7877ce80495765ed32ca0b3dba2ef467116a435f125fd',
  },
  Contests: {
    ContentAdded:
      '0x2f0d66b98c7708890a982e2194479b066a117a6f9a8f418f7f14c6001965b78b',
    RecurringContestStarted:
      '0x32391ebd47fc736bb885d21a45d95c3da80aef6987aa90a5c6e747e9bc755bc9',
    RecurringContestVoterVoted:
      '0x68d40dd5e34d499a209946f8e381c1258bdeff6dea4e96e9ab921da385c03667',
    SingleContestStarted:
      '0x002817006cf5e3f9ac0de6817ca39830ac7e731a4949a59e4ac3c8bef988b20c',
    SingleContestVoterVoted:
      '0xba2ce2b4fab99c4186fd3e0a8e93ffb61e332d0c4709bd01d01e7ac60631437a',
  },
  CommunityStake: {
    Trade: '0xfc13c9a8a9a619ac78b803aecb26abdd009182411d51a986090f82519d88a89e',
  },
  Launchpad: {
    TokenLaunched:
      '0xacba89c290ec5301484c0453f480dc9b83ab3a739c6b6e345ecd1b0525787d23',
    Trade: '0x9adcf0ad0cda63c4d50f26a48925cf6405df27d422a39c456b5f03f661c82982',
    TokenRegistered:
      '0xc2fe88a1a3c1957424571593960b97f158a519d0aa4cef9e13a247c64f1f4c35',
  },
  Referrals: {
    FeeDistributed:
      '0xadecf9f6e10f953395058158f0e6e399835cf1d045bbed7ecfa82947ecc0a368',
  },
  TokenStaking: {
    TokenLocked:
      '0x5da3351bc0f8e14d8760861eba9264c9fd75cbb4d3feb5872f3ccc47975f08ae',
    TokenLockDurationIncreased:
      '0x0ae1779f0f48655768fbd6947bf86654466f43d1afd878527b4859c7e491720f',
    TokenUnlocked:
      '0x89882ad382a3742d4db24e4dabc5000c5852aed762904db28442e4e1630a1d07',
    TokenPermanentConverted:
      '0xec3106009b080f87dfac07e494738f0a87d5e9a2473c111f1bfd16a5333589eb',
    TokenDelegated:
      '0xc2cb9f921d8d08b18eeb01511651fdbd60c938ea6795d0a7d994053800f48e8e',
    TokenUndelegated:
      '0x6d7f8a6578e88ed61f656e059018728da0fba2a3f4cab0c4adaca21ace3cbf24',
    TokenMerged:
      '0xe7eeebf74838dceecbee54a09b6a6f12b27cab64859c8f8a9fe2e492d226afad',
  },
  CommunityNominations: {
    NominatorSettled:
      '0x03618668aeac06c0bfc54fabb38080c1f51cd34f257c3773bf66044d2bb8b427',
    NominatorNominated:
      '0x7f484f73afbbbc0b24b4cca807c76ab1f6e9eec1cb84afc111f3fd37edd38c97',
    JudgeNominated:
      '0xd3381a18ee091ebc453476f9f0f9167642972862d5946a730a557ef658113ac1',
  },
} as const;

type Values<T> = T[keyof T];
type NestedValues<T> = Values<{ [K in keyof T]: Values<T[K]> }>;
export type EvmEventSignature = NestedValues<typeof EvmEventSignatures>;
