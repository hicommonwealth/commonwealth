import { TopicWeightedVoting } from '@hicommonwealth/schemas';

interface TopicFormRegular {
  name: string;
  description?: string;
  featuredInSidebar?: boolean;
  featuredInNewPost?: boolean;
  newPostTemplate?: string;
  allowTokenizedThreads?: boolean;
}

export interface TopicFormERC20 {
  tokenAddress?: string;
  tokenSymbol?: string;
  tokenDecimals?: number;
  voteWeightMultiplier?: number;
  chainNodeId?: number;
  weightedVoting?: TopicWeightedVoting | null;
}

export interface TopicFormSPL {
  tokenAddress?: string;
  tokenSymbol?: string;
  tokenDecimals?: number;
  voteWeightMultiplier?: number;
  weightedVoting?: TopicWeightedVoting | null;
}

export interface TopicFormSuiNative {
  voteWeightMultiplier?: number;
  chainNodeId?: number;
  weightedVoting?: TopicWeightedVoting | null;
}

export interface TopicFormSuiToken {
  tokenAddress?: string;
  tokenSymbol?: string;
  tokenDecimals?: number;
  voteWeightMultiplier?: number;
  chainNodeId?: number;
  weightedVoting?: TopicWeightedVoting | null;
  secondaryTokens?: Array<{
    token_address: string;
    token_symbol?: string;
    token_decimals: number;
    vote_weight_multiplier: number;
  }>;
}

export interface TopicFormStake {
  weightedVoting?: TopicWeightedVoting | null;
}

export type HandleCreateTopicProps = {
  erc20?: TopicFormERC20;
  spl?: TopicFormSPL;
  suiNative?: TopicFormSuiNative;
  suiToken?: TopicFormSuiToken;
  stake?: TopicFormStake;
};

export interface TopicForm
  extends TopicFormRegular,
    TopicFormERC20,
    TopicFormSPL,
    TopicFormSuiNative,
    TopicFormSuiToken {}
