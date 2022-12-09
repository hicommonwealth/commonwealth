"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisNamespaces = exports.BalanceType = exports.ChainNetwork = exports.ChainCategoryType = exports.WalletId = exports.ChainType = exports.ContractType = exports.ChainBase = exports.ProposalType = exports.NotificationCategories = void 0;
// This is a const and not an enum because of a weird webpack error.
// It has the same syntax, though, so it should be OK, as long as we don't
// modify any of the values.
// eslint-disable-next-line import/prefer-default-export
exports.NotificationCategories = {
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
var ProposalType;
(function (ProposalType) {
    ProposalType["SubstrateDemocracyReferendum"] = "referendum";
    ProposalType["SubstrateDemocracyProposal"] = "democracyproposal";
    ProposalType["SubstrateBountyProposal"] = "bountyproposal";
    ProposalType["SubstrateTreasuryTip"] = "treasurytip";
    ProposalType["SubstrateCollectiveProposal"] = "councilmotion";
    ProposalType["SubstrateTechnicalCommitteeMotion"] = "technicalcommitteemotion";
    ProposalType["PhragmenCandidacy"] = "phragmenelection";
    ProposalType["SubstrateTreasuryProposal"] = "treasuryproposal";
    ProposalType["Thread"] = "discussion";
    ProposalType["CosmosProposal"] = "cosmosproposal";
    ProposalType["MolochProposal"] = "molochproposal";
    ProposalType["CompoundProposal"] = "compoundproposal";
    ProposalType["AaveProposal"] = "onchainproposal";
    ProposalType["SputnikProposal"] = "sputnikproposal";
    ProposalType["SubstratePreimage"] = "democracypreimage";
    ProposalType["SubstrateImminentPreimage"] = "democracyimminent";
})(ProposalType = exports.ProposalType || (exports.ProposalType = {}));
var ChainBase;
(function (ChainBase) {
    ChainBase["CosmosSDK"] = "cosmos";
    ChainBase["Substrate"] = "substrate";
    ChainBase["Ethereum"] = "ethereum";
    ChainBase["NEAR"] = "near";
    ChainBase["Solana"] = "solana";
})(ChainBase = exports.ChainBase || (exports.ChainBase = {}));
var ContractType;
(function (ContractType) {
    ContractType["AAVE"] = "aave";
    ContractType["COMPOUND"] = "compound";
    ContractType["ERC20"] = "erc20";
    ContractType["ERC721"] = "erc721";
    ContractType["MARLINTESTNET"] = "marlin-testnet";
    ContractType["SPL"] = "spl";
    ContractType["MOLOCH1"] = "moloch1";
    ContractType["MOLOCH2"] = "moloch2";
    ContractType["COMMONPROTOCOL"] = "common-protocol";
})(ContractType = exports.ContractType || (exports.ContractType = {}));
var ChainType;
(function (ChainType) {
    ChainType["Chain"] = "chain";
    ChainType["DAO"] = "dao";
    ChainType["Token"] = "token";
    ChainType["Offchain"] = "offchain";
})(ChainType = exports.ChainType || (exports.ChainType = {}));
var WalletId;
(function (WalletId) {
    WalletId["Magic"] = "magic";
    WalletId["Polkadot"] = "polkadot";
    WalletId["Metamask"] = "metamask";
    WalletId["WalletConnect"] = "walletconnect";
    WalletId["KeplrEthereum"] = "keplr-ethereum";
    WalletId["Keplr"] = "keplr";
    WalletId["NearWallet"] = "near";
    WalletId["TerraStation"] = "terrastation";
    WalletId["TerraWalletConnect"] = "terra-walletconnect";
    WalletId["CosmosEvmMetamask"] = "cosm-metamask";
    WalletId["Phantom"] = "phantom";
    WalletId["Ronin"] = "ronin";
})(WalletId = exports.WalletId || (exports.WalletId = {}));
var ChainCategoryType;
(function (ChainCategoryType) {
    ChainCategoryType["DeFi"] = "DeFi";
    ChainCategoryType["DAO"] = "DAO";
})(ChainCategoryType = exports.ChainCategoryType || (exports.ChainCategoryType = {}));
// TODO: remove many of these chain networks, esp substrate (make them all "Substrate"),
// and just use id to identify specific chains for conditionals
var ChainNetwork;
(function (ChainNetwork) {
    ChainNetwork["Edgeware"] = "edgeware";
    ChainNetwork["EdgewareTestnet"] = "edgeware-testnet";
    ChainNetwork["Kusama"] = "kusama";
    ChainNetwork["Kulupu"] = "kulupu";
    ChainNetwork["Polkadot"] = "polkadot";
    ChainNetwork["Plasm"] = "plasm";
    ChainNetwork["Stafi"] = "stafi";
    ChainNetwork["Darwinia"] = "darwinia";
    ChainNetwork["Phala"] = "phala";
    ChainNetwork["Centrifuge"] = "centrifuge";
    ChainNetwork["Straightedge"] = "straightedge";
    ChainNetwork["Osmosis"] = "osmosis";
    ChainNetwork["Injective"] = "injective";
    ChainNetwork["InjectiveTestnet"] = "injective-testnet";
    ChainNetwork["Terra"] = "terra";
    ChainNetwork["Ethereum"] = "ethereum";
    ChainNetwork["NEAR"] = "near";
    ChainNetwork["NEARTestnet"] = "near-testnet";
    ChainNetwork["Moloch"] = "moloch";
    ChainNetwork["Compound"] = "compound";
    ChainNetwork["Aave"] = "aave";
    ChainNetwork["AaveLocal"] = "aave-local";
    ChainNetwork["dYdX"] = "dydx";
    ChainNetwork["Metacartel"] = "metacartel";
    ChainNetwork["ALEX"] = "alex";
    ChainNetwork["ERC20"] = "erc20";
    ChainNetwork["ERC721"] = "erc721";
    ChainNetwork["Clover"] = "clover";
    ChainNetwork["HydraDX"] = "hydradx";
    ChainNetwork["Crust"] = "crust";
    ChainNetwork["Sputnik"] = "sputnik";
    ChainNetwork["Commonwealth"] = "commonwealth";
    ChainNetwork["SolanaDevnet"] = "solana-devnet";
    ChainNetwork["SolanaTestnet"] = "solana-testnet";
    ChainNetwork["Solana"] = "solana";
    ChainNetwork["SPL"] = "spl";
    ChainNetwork["AxieInfinity"] = "axie-infinity";
    ChainNetwork["Evmos"] = "evmos";
    ChainNetwork["Kava"] = "kava";
})(ChainNetwork = exports.ChainNetwork || (exports.ChainNetwork = {}));
var BalanceType;
(function (BalanceType) {
    BalanceType["AxieInfinity"] = "axie-infinity";
    BalanceType["Terra"] = "terra";
    BalanceType["Ethereum"] = "ethereum";
    BalanceType["Solana"] = "solana";
    BalanceType["Cosmos"] = "cosmos";
    BalanceType["NEAR"] = "near";
    BalanceType["Substrate"] = "substrate";
})(BalanceType = exports.BalanceType || (exports.BalanceType = {}));
var RedisNamespaces;
(function (RedisNamespaces) {
    RedisNamespaces["Chat_Socket"] = "chat_socket";
})(RedisNamespaces = exports.RedisNamespaces || (exports.RedisNamespaces = {}));
