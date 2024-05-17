import { tokensToWei, weiToTokens } from 'helpers';
import { ERC_SPECIFICATIONS, SPL_SPECIFICATION, TOKENS } from './constants';

const converter = (
  requirementType: 'erc20' | 'erc721' | 'eth_native' | 'cosmos_native' | 'spl',
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

  if (requirementType == SPL_SPECIFICATION) {
    return converterFunc(amount, 6);
  }

  // assuming the specification is erc721
  return amount;
};

export const convertRequirementAmountFromWeiToTokens = (
  requirementType: 'erc20' | 'erc721' | 'eth_native' | 'cosmos_native' | 'spl',
  amount: string,
) => {
  return converter(requirementType, amount.trim(), weiToTokens);
};

export const convertRequirementAmountFromTokensToWei = (
  requirementType: 'erc20' | 'erc721' | 'eth_native' | 'cosmos_native' | 'spl',
  amount: string,
) => {
  return converter(requirementType, amount.trim(), tokensToWei);
};
