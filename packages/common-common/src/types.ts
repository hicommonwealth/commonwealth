// This is a const and not an enum because of a weird webpack error.
// It has the same syntax, though, so it should be OK, as long as we don't
// modify any of the values.
// eslint-disable-next-line import/prefer-default-export
export const NotificationCategories = {
  NewComment: 'new-comment-creation',
  NewThread: 'new-thread-creation',
  NewCommunity: 'new-community-creation',
  NewRoleCreation: 'new-role-creation',
  NewMention: 'new-mention',
  NewReaction: 'new-reaction',
  NewCollaboration: 'new-collaboration',
  ThreadEdit: 'thread-edit',
  CommentEdit: 'comment-edit',
  ChainEvent: 'chain-event',
  EntityEvent: 'entity-event',
  NewChatMention: 'new-chat-mention',
};

export enum ProposalType {
  SubstrateDemocracyReferendum = 'referendum',
  SubstrateDemocracyProposal = 'democracyproposal',
  SubstrateBountyProposal = 'bountyproposal',
  SubstrateTreasuryTip = 'treasurytip',
  SubstrateCollectiveProposal = 'councilmotion',
  SubstrateTechnicalCommitteeMotion = 'technicalcommitteemotion',
  PhragmenCandidacy = 'phragmenelection',
  SubstrateTreasuryProposal = 'treasuryproposal',
  Thread = 'discussion',
  CosmosProposal = 'cosmosproposal',
  MolochProposal = 'molochproposal',
  CompoundProposal = 'compoundproposal',
  AaveProposal = 'onchainproposal',
  SputnikProposal = 'sputnikproposal',
  SubstratePreimage = 'democracypreimage',
  SubstrateImminentPreimage = 'democracyimminent',
}

export enum ChainBase {
  CosmosSDK = 'cosmos',
  Substrate = 'substrate',
  Ethereum = 'ethereum',
  NEAR = 'near',
  Solana = 'solana',
}

export enum ChainType {
  Chain = 'chain',
  DAO = 'dao',
  Token = 'token',
  Offchain = 'offchain',
}

export enum WalletId {
  Magic = 'magic',
  Polkadot = 'polkadot',
  Metamask = 'metamask',
  WalletConnect = 'walletconnect',
  KeplrEthereum = 'keplr-ethereum',
  Keplr = 'keplr',
  NearWallet = 'near',
  TerraStation = 'terrastation',
  CosmosEvmMetamask = 'cosm-metamask',
  Phantom = 'phantom',
  Ronin = 'ronin',
}

export enum ChainCategoryType {
  DeFi = 'DeFi',
  DAO = 'DAO',
}

// TODO: remove many of these chain networks, esp substrate (make them all "Substrate"),
// and just use id to identify specific chains for conditionals
export enum ChainNetwork {
  Edgeware = 'edgeware',
  EdgewareTestnet = 'edgeware-testnet',
  Kusama = 'kusama',
  Kulupu = 'kulupu',
  Polkadot = 'polkadot',
  Plasm = 'plasm',
  Stafi = 'stafi',
  Darwinia = 'darwinia',
  Phala = 'phala',
  Centrifuge = 'centrifuge',
  Straightedge = 'straightedge',
  Osmosis = 'osmosis',
  Injective = 'injective',
  InjectiveTestnet = 'injective-testnet',
  Terra = 'terra',
  Ethereum = 'ethereum',
  NEAR = 'near',
  NEARTestnet = 'near-testnet',
  Moloch = 'moloch',
  Compound = 'compound',
  Aave = 'aave',
  AaveLocal = 'aave-local',
  dYdX = 'dydx',
  Metacartel = 'metacartel',
  ALEX = 'alex',
  ERC20 = 'erc20',
  ERC721 = 'erc721',
  Clover = 'clover',
  HydraDX = 'hydradx',
  Crust = 'crust',
  Sputnik = 'sputnik',
  Commonwealth = 'commonwealth',
  SolanaDevnet = 'solana-devnet',
  SolanaTestnet = 'solana-testnet',
  Solana = 'solana',
  SPL = 'spl', // solana token
  AxieInfinity = 'axie-infinity',
  Evmos = 'evmos',
}

export enum ContractType {
  DaoFactory = 'Dao Factory',
  ERC20 = 'erc20',
  ERC721 = 'erc721',
  SPL = 'spl', // solana token
  Compound = 'compound',
  Aave = 'aave',
}

export enum BalanceType {
  AxieInfinity = 'axie-infinity',
  Terra = 'terra',
  Ethereum = 'ethereum',
  Solana = 'solana',
  Cosmos = 'cosmos',
}
