import { tokensToWei, weiToTokens } from 'helpers';
import {
  ERC_SPECIFICATIONS,
  SOL_NFT_SPECIFICATION,
  SPL_SPECIFICATION,
  TOKENS,
} from './constants';

const converter = (
  requirementType:
    | 'erc20'
    | 'erc721'
    | 'eth_native'
    | 'cosmos_native'
    | 'sui_native'
    | 'spl'
    | 'metaplex',
  amount: string,
  converterFunc: typeof weiToTokens | typeof tokensToWei,
) => {
  if (requirementType === TOKENS.COSMOS_TOKEN) {
    return converterFunc(amount, 6);
  }

  if (
    requirementType === TOKENS.EVM_TOKEN ||
    requirementType === ERC_SPECIFICATIONS.ERC_20
  ) {
    return converterFunc(amount, 18);
  }

  if (requirementType === TOKENS.SUI_TOKEN) {
    return converterFunc(amount, 9);
  }

  if (requirementType == SPL_SPECIFICATION) {
    return converterFunc(amount, 6);
  }

  if (requirementType === SOL_NFT_SPECIFICATION) {
    return amount;
  }

  // assuming the specification is erc721
  return amount;
};

export const convertRequirementAmountFromWeiToTokens = (
  requirementType:
    | 'erc20'
    | 'erc721'
    | 'eth_native'
    | 'cosmos_native'
    | 'sui_native'
    | 'spl'
    | 'metaplex',
  amount: string,
) => {
  return converter(requirementType, amount?.trim(), weiToTokens);
};

export const convertRequirementAmountFromTokensToWei = (
  requirementType:
    | 'erc20'
    | 'erc721'
    | 'eth_native'
    | 'cosmos_native'
    | 'sui_native'
    | 'spl'
    | 'metaplex',
  amount: string,
) => {
  return converter(requirementType, amount.trim(), tokensToWei);
};
