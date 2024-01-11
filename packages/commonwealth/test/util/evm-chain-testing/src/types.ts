export interface erc20BalanceReq {
  tokenAddress: string;
  address: string;
  convert?: boolean;
}

export interface erc20Transfer {
  tokenAddress: string;
  to: string;
  from?: string;
  amount: string;
  accountIndex?: number;
  fromBank?: boolean;
}

export interface erc20Approve {
  tokenAddress: string;
  spender: string;
  amount: string;
  accountIndex?: number;
}

export interface dexGetTokens {
  tokens: string[];
  value: string[];
  accountIndex?: number;
}

export interface govCompVote {
  proposalId: string | number;
  accountIndex: number;
  forAgainst: boolean;
}

export interface govCompGetVotes {
  accountIndex: number;
  numberOfVotes: string;
}

export interface govCompProposalId {
  proposalId: string;
}

export interface govCompCreate {
  accountIndex: number;
}

export interface chainAdvanceTime {
  seconds: string;
  blocks: number | string;
}

export interface chainGetEth {
  toAddress: string;
  amount: string;
}

export interface erc721Approve {
  nftAddress: string;
  tokenId: string;
  to: number;
  all?: boolean;
  accountIndex?: number;
  from?: string;
}

export interface erc721MintBurn {
  nftAddress: string;
  tokenId: string;
  to: number;
  mint: boolean;
}

export interface erc1155Mint {
  contractAddress: string;
  tokenId: string;
  to: string;
  amount: number;
}
