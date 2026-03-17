/**
 * Builds and sends the on-chain prediction market deployment transaction
 * (FutarchyGovernor.propose), then returns the deploy payload for
 * deployPredictionMarket mutation.
 */

import PredictionMarket, {
  type DeployPredictionMarketPayload,
} from 'client/scripts/helpers/ContractHelpers/predictionMarket';
import {
  getCollateralBalanceAndSymbol,
  parseTokenAmount,
} from 'client/scripts/helpers/ContractHelpers/predictionMarketTrade';
import { getEthereumProviderForAddress } from 'client/scripts/helpers/getEthereumProviderForAddress';

export type { DeployPredictionMarketPayload };

export type DeployPredictionMarketOnChainParams = {
  eth_chain_id: number;
  chain_rpc: string;
  user_address: string;
  prompt: string;
  collateral_address: `0x${string}`;
  duration_days: number;
  resolution_threshold: number;
  initial_liquidity: string;
};

const EVM_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;
const POSITIVE_DECIMAL_REGEX = /^\d+(\.\d+)?$/;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

function assertValidEthereumAddress(
  value: unknown,
  fieldName: string,
): asserts value is `0x${string}` {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(
      `Invalid parameters: must provide an Ethereum address for ${fieldName}`,
    );
  }
  const trimmed = value.trim();
  if (!EVM_ADDRESS_REGEX.test(trimmed)) {
    throw new Error(
      `Invalid parameters: ${fieldName} must be a valid Ethereum address (0x + 40 hex chars)`,
    );
  }
}

export async function convertInitialLiquidityToWei(params: {
  chain_rpc: string;
  collateral_address: `0x${string}`;
  initial_liquidity: string;
  user_address?: string;
}): Promise<bigint> {
  const initialLiquidity = params.initial_liquidity.trim();
  if (!POSITIVE_DECIMAL_REGEX.test(initialLiquidity)) {
    throw new Error('Initial liquidity must be a valid decimal number.');
  }
  const readAddress =
    params.user_address && EVM_ADDRESS_REGEX.test(params.user_address)
      ? params.user_address
      : ZERO_ADDRESS;
  const { decimals } = await getCollateralBalanceAndSymbol(
    params.chain_rpc,
    readAddress,
    params.collateral_address,
  );
  return parseTokenAmount(initialLiquidity, decimals);
}

/**
 * Executes the on-chain deployment flow using PredictionMarket helper.
 *
 * @throws Error when chain not configured, wallet not connected, or addresses invalid
 */
export async function deployPredictionMarketOnChain(
  params: DeployPredictionMarketOnChainParams,
): Promise<DeployPredictionMarketPayload> {
  assertValidEthereumAddress(params.user_address, 'user_address (wallet)');
  assertValidEthereumAddress(params.collateral_address, 'collateral_address');

  const governorAddress = PredictionMarket.getGovernorAddress(
    params.eth_chain_id,
  );
  if (!governorAddress) {
    throw new Error('On-chain deployment is not configured for this chain.');
  }

  // Use the wallet that owns user_address so deploy works with multiple wallets (e.g. MetaMask + OKX).
  const provider = await getEthereumProviderForAddress(
    params.user_address,
    params.eth_chain_id,
  );
  if (!provider) {
    throw new Error(
      'Could not find the wallet for this address. Ensure the wallet is connected.',
    );
  }

  const pm = new PredictionMarket(governorAddress, params.chain_rpc);
  await pm.initialize(true, String(params.eth_chain_id), provider);

  return pm.deploy({
    user_address: params.user_address,
    collateral_address: params.collateral_address,
    duration_days: params.duration_days,
    resolution_threshold: params.resolution_threshold,
    initial_liquidity: params.initial_liquidity,
  });
}
