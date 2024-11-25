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
      '0x8870ba2202802ce285ce6bead5ac915b6dc2d35c8a9d6f96fa56de9de12829d5',
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
} as const;

type Values<T> = T[keyof T];
type NestedValues<T> = Values<{ [K in keyof T]: Values<T[K]> }>;
export type EvmEventSignature = NestedValues<typeof EvmEventSignatures>;
