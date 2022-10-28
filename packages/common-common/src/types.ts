import { BigNumber } from "ethers";
import * as _ from "lodash";
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

export enum ContractType {
  AAVE = 'aave',
  COMPOUND = 'compound',
  ERC20 = 'erc20',
  ERC721 = 'erc721',
  MARLINTESTNET = 'marlin-testnet',
  SPL = 'spl',
  MOLOCH1 = 'moloch1', // unused
  MOLOCH2 = 'moloch2', // unused
  COMMONPROTOCOL = 'common-protocol'
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

export enum BalanceType {
  AxieInfinity = 'axie-infinity',
  Terra = 'terra',
  Ethereum = 'ethereum',
  Solana = 'solana',
  Cosmos = 'cosmos',
  NEAR = 'near',
  Substrate = 'substrate',
}

export enum SolidityType {
  address = "address",
  uint256 = "uint256",
  uint128 = "uint128",
  uint64 = "uint64",
  uint32 = "uint32",
  uint8 = "uint8",
  uint = "uint",
  bytes32 = "bytes32",
  boolean = "bool",
  string = "string",
  bytes = "bytes",
  tuple = "tuple",
}

export enum SolidityInternalType {
  address_payable = "address payable",
  contract = "contract",
  enum = "enum",
  struct = "struct",
  address = "address",
  uint256 = "uint256",
  uint128 = "uint128",
  uint64 = "uint64",
  uint32 = "uint32",
  uint8 = "uint8",
  uint = "uint",
  bytes32 = "bytes32",
  boolean = "bool",
  string = "string",
  bytes = "bytes",
}

export enum SolidityStateMutability {
  pure = "pure",
  view = "view",
  nonpayable = "nonpayable",
  payable = "payable",
}

export type Address = string;
export type UInt = BigNumber;
export type Bytes32 = string;
export type TxHash = string;

export const networkIdToName = {
    1: "mainnet",
    3: "ropsten",
    4: "rinkeby",
    5: "goerli",
    42: "kovan",
};

export const networkNameToId = {
    "mainnet": 1,
    "ropsten": 3,
    "rinkeby": 4,
    "goerli": 5,
    "kovan": 42,
};

// Use Web3-Core Types For Most Things